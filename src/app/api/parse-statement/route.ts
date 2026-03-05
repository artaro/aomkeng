import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFDocument } from 'pdf-lib';

const genAI = new GoogleGenerativeAI(process.env.LLM_API_KEY || '');

const SYSTEM_PROMPT_BASE = `You are a strict financial data extraction assistant. Your ONLY job is to extract transaction rows from the provided bank statement (PDF, CSV, or Image) into a JSON array.

Strict Rules:
- Extract data ONLY from the transaction table(s).
- IGNORE all other text, headers, footers, balances, ads, or personal info.
- If the file is a CSV, parse the rows.
- If the file is a PDF/Image, visually identify the transaction table.
- Each transaction must have:
  - "date": YYYY-MM-DD
  - "time": HH:mm (24-hour) or "" if missing
  - "description": CRITICAL — For Thai bank statements (KBank, SCB, etc.), the table has BOTH a 'รายการ' column (generic type like ชำระเงิน/โอนเงิน) AND a 'รายละเอียด' column (detailed info with ref codes, merchant names, account numbers). You MUST use the 'รายละเอียด' column for description, NEVER the 'รายการ' column. The 'รายละเอียด' column is usually the rightmost/widest column. If 'รายละเอียด' is not present, use the most detailed description column available.
  - "amount": Positive number (float). ABSOLUTELY NO NEGATIVE SIGNS or commas.
  - "type": Classify as "income" or "expense" using these rules (check in order):
    1. If the statement has separate debit/credit columns (ถอน/ฝาก or debit/credit): amount in debit column = "expense", amount in credit column = "income".
    2. If there is a 'รายการ' column: "หักบัญชี", "ชำระเงิน", "โอนเงิน" (outgoing), "ถอนเงิน" = "expense". "เงินเข้า", "รับโอน" = "income".
    3. If the amount has a MINUS sign (e.g. -500.00) in the original statement, it means money left the account = "expense".
    4. If the amount is positive and not in a debit column = "income".
    5. Default to "expense" if uncertain.

Output ONLY this JSON array. No markdown formatting. No explanation.`;

// Map file extensions / MIME types to Gemini-supported mimeType strings
function resolveGeminiMimeType(mimeType: string, filename: string): string {
  if (mimeType === 'application/pdf') return 'application/pdf';
  if (mimeType === 'image/png') return 'image/png';
  if (mimeType === 'image/webp') return 'image/webp';
  if (mimeType === 'image/heic' || mimeType === 'image/heif') return 'image/heic';
  if (mimeType === 'image/gif') return 'image/gif';
  // Default: treat as jpeg (covers image/jpeg + compressed blobs)
  if (mimeType.startsWith('image/')) return 'image/jpeg';
  // Fallback by extension
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  return 'image/jpeg';
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.LLM_API_KEY) {
      return NextResponse.json(
        { error: 'LLM_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Accept FormData (sent by useStatementImport hook)
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    let fileBuffer = Buffer.from(arrayBuffer);
    const geminiMimeType = resolveGeminiMimeType(file.type, file.name);

    // For PDFs: attempt to decrypt if password-protected
    if (geminiMimeType === 'application/pdf') {
      try {
        // Try loading without password first to detect encryption
        const pdfDoc = await PDFDocument.load(fileBuffer);
        // If encrypted and we decrypted, save decrypted bytes for Gemini
        if (pdfDoc.isEncrypted) {
          const decryptedBytes = await pdfDoc.save();
          fileBuffer = Buffer.from(decryptedBytes);
        }
      } catch (pdfErr: unknown) {
        const msg = pdfErr instanceof Error ? pdfErr.message : String(pdfErr);
        // Encrypted but wrong/missing password
        if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypt')) {
          return NextResponse.json(
            { error: 'PDF is password protected', code: 'PASSWORD_REQUIRED' },
            { status: 401 }
          );
        }
        // Other PDF parse errors — fall through and let Gemini try
        console.warn('[parse-statement] pdf-lib parse warning:', msg);
      }
    }

    const base64Data = fileBuffer.toString('base64');

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: SYSTEM_PROMPT_BASE,
    });

    // Build prompt
    const promptText = 'Extract transactions from this file. Return ONLY a valid JSON array.';

    // Generate content
    const result = await model.generateContent([
      promptText,
      {
        inlineData: {
          data: base64Data,
          mimeType: geminiMimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Clean markdown fences if Gemini wraps in ```json ... ```
    let cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBracket = cleanedText.indexOf('[');
    const lastBracket = cleanedText.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      cleanedText = cleanedText.substring(firstBracket, lastBracket + 1);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let transactions: any[] = [];
    try {
      transactions = JSON.parse(cleanedText);
    } catch {
      console.warn('[parse-statement] Failed to parse Gemini response as JSON:', text);
      return NextResponse.json(
        { error: 'AI could not extract transactions from this file. Please try a clearer image.' },
        { status: 422 }
      );
    }

    // Validate & filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validTransactions = transactions.filter((t: any) =>
      t.date && t.description && typeof t.amount === 'number' &&
      (t.type === 'income' || t.type === 'expense')
    );

    if (validTransactions.length === 0) {
      return NextResponse.json(
        { error: 'No valid transactions found in the file.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ transactions: validTransactions });

  } catch (error) {
    console.error('[parse-statement] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
