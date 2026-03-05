'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Landmark, X, DollarSign, Building2 } from 'lucide-react';
import { CreateAccountInput, UpdateAccountInput, Account } from '@/features/expenses/types';
import { AccountType } from '@/features/expenses/types';
import { useTranslation } from '@/shared/lib/i18n';

interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAccountInput | UpdateAccountInput) => void;
  initialData?: Account | null;
  loading?: boolean;
}

export default function AccountForm({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: AccountFormProps) {
  const { t } = useTranslation();
  const isEdit = !!initialData;

  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<AccountType>(initialData?.type || AccountType.BANK);
  const [balance, setBalance] = useState(String(initialData?.balance ?? 0));
  const [bankName, setBankName] = useState(initialData?.bankName || '');
  const [last4, setLast4] = useState(initialData?.accountNumberLast4 || '');
  const [creditLimit, setCreditLimit] = useState(
    initialData?.creditLimit != null ? String(initialData.creditLimit) : ''
  );

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line
      setName(initialData?.name || '');
      setType(initialData?.type || AccountType.BANK);
      setBalance(String(initialData?.balance ?? 0));
      setBankName(initialData?.bankName || '');
      setLast4(initialData?.accountNumberLast4 || '');
      setCreditLimit(initialData?.creditLimit != null ? String(initialData.creditLimit) : '');
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      type,
      balance: parseFloat(balance) || 0,
      bankName: bankName || undefined,
      accountNumberLast4: last4 || undefined,
      ...(type === AccountType.CREDIT_CARD && creditLimit
        ? { creditLimit: parseFloat(creditLimit) || undefined }
        : {}),
    };
    onSubmit(data);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[6px_6px_0px_0px_var(--color-primary)] w-full max-w-sm flex flex-col pt-2 animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b-2 border-[var(--color-border)]">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-[var(--font-brand)] uppercase tracking-wider">
            {isEdit ? t('accountForm.editAccount') : t('accountForm.addAccount')}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
           
           {/* Account Name */}
           <div>
             <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 ml-1">{t('accountForm.accountName')}</label>
             <input 
               type="text"
               required
               value={name}
               onChange={(e) => setName(e.target.value)}
               className="brutal-input w-full px-4 py-2.5"
               placeholder={t('accountForm.accountNamePlaceholder')} 
             />
           </div>

           {/* Account Type */}
           <div>
             <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 ml-1">{t('accountForm.accountType')}</label>
             <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => !isEdit && setType(AccountType.BANK)}
                    disabled={isEdit}
                    className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-bold tracking-wider border-2 transition-all ${
                        isEdit ? 'cursor-not-allowed opacity-60' : ''
                    } ${
                        type === AccountType.BANK
                        ? 'border-[var(--color-income)] bg-[var(--color-income)] text-[var(--color-background)] shadow-[2px_2px_0px_0px_var(--color-border)]'
                        : 'border-[var(--color-border)] hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'
                    }`}
                >
                    <Landmark size={18} /> {t('accountForm.bankType')}
                </button>
                <button
                    type="button"
                    onClick={() => !isEdit && setType(AccountType.CREDIT_CARD)}
                    disabled={isEdit}
                    className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-bold tracking-wider border-2 transition-all ${
                        isEdit ? 'cursor-not-allowed opacity-60' : ''
                    } ${
                        type === AccountType.CREDIT_CARD
                        ? 'border-[var(--color-expense)] bg-[var(--color-expense)] text-[var(--color-background)] shadow-[2px_2px_0px_0px_var(--color-border)]'
                        : 'border-[var(--color-border)] hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'
                    }`}
                >
                    <CreditCard size={18} /> {t('accountForm.creditType')}
                </button>
            </div>
           </div>

           {/* Balance */}
           <div>
             <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 ml-1">
               {type === AccountType.CREDIT_CARD ? t('accountForm.outstandingBalance') : t('accountForm.currentBalance')}
             </label>
             <div className="relative">
               <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
               <input 
                 type="number"
                 step="0.01"
                 value={balance}
                 onChange={(e) => setBalance(e.target.value)}
                 className="brutal-input w-full pl-10 pr-4 py-2.5 font-medium" 
                 placeholder="0.00"
               />
             </div>
           </div>

           {/* Bank Name */}
           <div>
             <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 ml-1">{t('accountForm.bankName')}</label>
             <div className="relative">
               <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
               <input 
                 type="text"
                 value={bankName}
                 onChange={(e) => setBankName(e.target.value)}
                 className="brutal-input w-full pl-10 pr-4 py-2.5" 
                 placeholder={t('accountForm.bankNamePlaceholder')}
               />
             </div>
           </div>

           {/* Last 4 Digits */}
           <div>
             <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 ml-1">{t('accountForm.last4')}</label>
             <input
               type="text"
               maxLength={4}
               value={last4}
               onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
               className="brutal-input w-full px-4 py-2.5 tracking-widest"
               placeholder="1234"
             />
           </div>

           {/* Credit Limit (credit cards only) */}
           {type === AccountType.CREDIT_CARD && (
             <div>
               <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5 ml-1">{t('accountForm.creditLimit')}</label>
               <div className="relative">
                 <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                 <input
                   type="number"
                   step="0.01"
                   min="0"
                   value={creditLimit}
                   onChange={(e) => setCreditLimit(e.target.value)}
                   className="brutal-input w-full pl-10 pr-4 py-2.5 font-medium"
                   placeholder={t('accountForm.creditLimitPlaceholder')}
                 />
               </div>
             </div>
           )}

           {/* Actions */}
           <div className="pt-4 flex justify-end gap-3 mt-2">
             <button 
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] border-2 border-[var(--color-border)] transition-colors uppercase tracking-wider"
                disabled={loading}
             >
                {t('common.cancel')}
             </button>
             <button 
                type="submit"
                className="brutal-btn px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !name.trim()}
             >
                {loading ? t('common.saving') : (isEdit ? t('accountForm.update') : t('accountForm.create'))}
             </button>
           </div>
        </form>
      </div>
    </div>
  );
}
