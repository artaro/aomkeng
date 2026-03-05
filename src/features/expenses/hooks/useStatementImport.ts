'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCreateTransactionsBulk } from '@/features/expenses/hooks/useTransactions';
import { CreateTransactionInput } from '@/features/expenses/types';
import { TransactionType, StatementSource } from '@/features/expenses/types';
import { compressImage } from '@/shared/lib/imageUtils';
import { toLocalISOString } from '@/shared/lib/formatters';

const LAST_IMPORT_KEY = 'aomkeng_last_import';

export interface ParsedLLMTransaction {
    date: string;
    time?: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category?: string; // For manual category assignment in UI
}

type ImportStatus =
    | 'idle'
    | 'reading'
    | 'needs_password'
    | 'parsing'
    | 'ready'
    | 'importing'
    | 'done'
    | 'error';

interface UseStatementImportReturn {
    status: ImportStatus;
    file: File | null;
    transactions: ParsedLLMTransaction[];
    setTransactions: React.Dispatch<React.SetStateAction<ParsedLLMTransaction[]>>;
    error: string | null;
    pdfPassword: string;
    setPdfPassword: (pw: string) => void;
    handleFileSelect: (file: File) => void;
    parseWithLLM: () => Promise<void>;
    importTransactions: (accountId: string) => Promise<void>;
    loadLastImport: () => void;
    hasLastImport: boolean;
    reset: () => void;
    fileType: 'document' | 'image';
    setFileType: (type: 'document' | 'image') => void;
}



export function useStatementImport(): UseStatementImportReturn {
    const [status, setStatus] = useState<ImportStatus>('idle');
    const [file, setFile] = useState<File | null>(null);
    const [fileType, setFileType] = useState<'document' | 'image'>('document');
    const [transactions, setTransactions] = useState<ParsedLLMTransaction[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [pdfPassword, setPdfPassword] = useState('');
    const [hasLastImport, setHasLastImport] = useState(false);

    const bulkCreate = useCreateTransactionsBulk();

    // Check if there is a saved import in localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(LAST_IMPORT_KEY);
            setHasLastImport(!!saved);
        } catch { /* ignore */ }
    }, []);

    const handleFileSelect = useCallback((selectedFile: File) => {
        setFile(selectedFile);
        setFileType(selectedFile.type.startsWith('image/') ? 'image' : 'document');
        setTransactions([]);
        setError(null);
        setPdfPassword('');
        setStatus('idle');
    }, []);

    const parseWithLLM = useCallback(async () => {
        if (!file) {
            setError('No file selected');
            return;
        }

        // Reset error only if it's not a password retry
        if (status !== 'needs_password') {
            setError(null);
        }

        try {
            // Step 1: Prepare data
            setStatus('parsing'); // Use parsing status immediately to show loader


            // Compress if image to avoid payload limits (common on mobile)
            let fileToUpload = file;
            if (file.type.startsWith('image/')) {
                try {
                    fileToUpload = await compressImage(file);
                } catch (e) {
                    console.warn('Image compression failed, trying original', e);
                }
            }

            const formData = new FormData();
            formData.append('file', fileToUpload);
            if (pdfPassword) {
                formData.append('password', pdfPassword);
            }

            // Step 2: Send to LLM API
            const response = await fetch('/api/parse-statement', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json();

                // Handle password required
                if (response.status === 401 && err.code === 'PASSWORD_REQUIRED') {
                    setStatus('needs_password');
                    setError(pdfPassword ? 'Incorrect password' : 'PDF is password protected');
                    return;
                }

                throw new Error(err.error || 'Failed to parse statement');
            }

            const data = await response.json();

            if (!data.transactions || data.transactions.length === 0) {
                setError('No transactions found in the file');
                setStatus('error');
                return;
            }

            setTransactions(data.transactions);
            setStatus('ready');
            setError(null);

            // Persist to localStorage for recovery
            try {
                localStorage.setItem(LAST_IMPORT_KEY, JSON.stringify(data.transactions));
                setHasLastImport(true);
            } catch { /* quota exceeded, ignore */ }
        } catch (err) {
            console.error('Parse error:', err);
            setError(err instanceof Error ? err.message : 'Failed to parse file');
            setStatus('error');
        }
    }, [file, pdfPassword, status]);


    const loadLastImport = useCallback(() => {
        try {
            const saved = localStorage.getItem(LAST_IMPORT_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as ParsedLLMTransaction[];
                setTransactions(parsed);
                setStatus('ready');
                setError(null);
                setFile(null);
            }
        } catch {
            setError('Failed to load saved import');
        }
    }, []);

    const importTransactions = useCallback(
        async (accountId: string) => {
            if (transactions.length === 0) {
                setError('No transactions to import');
                return;
            }

            setStatus('importing');
            setError(null);

            try {
                const inputs: CreateTransactionInput[] = transactions.map((tx, i) => {
                    // Always combine date and time with local timezone offset
                    const time = tx.time || '00:00';
                    const transactionDate = toLocalISOString(tx.date, time);

                    return {
                        accountId,
                        categoryId: tx.category, // Use assigned category if present
                        type:
                            tx.type === 'income'
                                ? TransactionType.INCOME
                                : TransactionType.EXPENSE,
                        amount: tx.amount,
                        description: tx.description,
                        transactionDate,
                        source: StatementSource.LLM_IMPORT,
                        referenceId: `llm-${tx.date}-${tx.amount}-${i}-${Date.now()}`,
                        destinationAccountId: null,
                    };
                });

                await bulkCreate.mutateAsync(inputs);
                setStatus('done');

                // Clear saved import after successful import
                try { localStorage.removeItem(LAST_IMPORT_KEY); setHasLastImport(false); } catch { /* ignore */ }
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'Failed to import transactions'
                );
                setStatus('error');
            }
        },
        [transactions, bulkCreate]
    );

    const reset = useCallback(() => {
        setFile(null);
        setTransactions([]);
        setStatus('idle');
        setError(null);
        setPdfPassword('');
    }, []);

    return {
        status,
        file,
        transactions,
        setTransactions, // Exposed for UI editing
        error,
        pdfPassword,
        setPdfPassword,
        handleFileSelect,
        parseWithLLM,
        importTransactions,
        loadLastImport,
        hasLastImport,
        reset,
        fileType,
        setFileType,
    };
}
