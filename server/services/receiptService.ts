import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';

export interface ExtractedReceiptData {
  merchant?: string;
  amount?: number;
  currency?: string;
  date?: string;
  category?: string;
  paymentMethod?: string;
  description?: string;
  notes?: string;
  confidence?: number;
  isSimulated?: boolean;
  message?: string;
}

export interface ReceiptScanResult {
  data: ExtractedReceiptData;
  receiptUrl: string;
}

// Ensure receipt upload directory exists (with Vercel serverless /tmp fallback)
export const UPLOAD_DIR = process.env.VERCEL
  ? path.join('/tmp', 'uploads', 'receipts')
  : path.resolve(process.cwd(), 'data', 'uploads', 'receipts');

try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create receipts directory:', e);
}

export const receiptService = {
  /**
   * Save receipt image to disk and return accessible URL path
   */
  saveReceiptFile(buffer: Buffer, mimeType: string, originalName?: string): string {
    const ext = mimeType.includes('png')
      ? 'png'
      : mimeType.includes('webp')
      ? 'webp'
      : mimeType.includes('pdf')
      ? 'pdf'
      : 'jpg';

    const safeName = `receipt_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeName);

    try {
      fs.writeFileSync(filePath, buffer);
      return `/api/transactions/receipts/${safeName}`;
    } catch (err) {
      console.error('Error saving receipt file to disk:', err);
      // Fallback to inlined data URL if file write fails
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    }
  },

  /**
   * Parse bill or receipt image using Gemini Vision AI (with fallback)
   */
  async scanReceipt(
    base64Data: string,
    mimeType = 'image/jpeg',
    fileName?: string
  ): Promise<ReceiptScanResult> {
    // 1. Clean base64 string
    let cleanBase64 = base64Data;
    let resolvedMime = mimeType;

    if (base64Data.startsWith('data:')) {
      const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        resolvedMime = match[1];
        cleanBase64 = match[2];
      }
    }

    const imageBuffer = Buffer.from(cleanBase64, 'base64');
    const receiptUrl = this.saveReceiptFile(imageBuffer, resolvedMime, fileName);

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
You are an expert OCR and financial data extractor for the Money Vedass expense tracker.
Inspect this bill, receipt, or invoice image carefully.
Extract the relevant financial information and return ONLY a valid JSON object matching this schema:
{
  "merchant": "Vendor, shop, utility, or business name (e.g. Swiggy, Amazon, Reliance Retail, Starbucks)",
  "amount": 0.00, // strictly a positive number representing total amount paid or due
  "currency": "INR", // 3-letter currency code (INR, USD, EUR, GBP, etc. Default to INR if ₹ or ambiguous)
  "date": "YYYY-MM-DD", // Date of bill in ISO YYYY-MM-DD format (use today if unclear)
  "category": "one of: food, shopping, bills, electricity, water, broadband, mobile_recharge, gas_bill, transport, entertainment, health, education, housing, other",
  "paymentMethod": "one of: UPI, Credit Card, Debit Card, Cash, Bank Transfer",
  "description": "Concise summary e.g. 'Grocery items from Supermarket' or 'Dinner at Restaurant'",
  "notes": "Brief item list or invoice number if legible",
  "confidence": 0.95 // value between 0.0 and 1.0
}
Strict Rule: Output ONLY the raw JSON string without markdown quotes or explanation.
`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            prompt,
            {
              inlineData: {
                mimeType: resolvedMime,
                data: cleanBase64,
              },
            },
          ],
        });

        const rawText = response.text || '';
        const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(cleanedJson);

        return {
          data: {
            merchant: parsed.merchant || 'Vendor',
            amount: Number(parsed.amount) || undefined,
            currency: parsed.currency || 'INR',
            date: parsed.date || new Date().toISOString().split('T')[0],
            category: parsed.category || 'shopping',
            paymentMethod: parsed.paymentMethod || 'UPI',
            description: parsed.description || `Purchase at ${parsed.merchant || 'Merchant'}`,
            notes: parsed.notes || undefined,
            confidence: parsed.confidence || 0.9,
            isSimulated: false,
          },
          receiptUrl,
        };
      } catch (err: any) {
        console.warn('Gemini AI bill extraction error (falling back to smart heuristics):', err?.message || err);
      }
    }

    // Heuristic / Demo Fallback (when GEMINI_API_KEY is not set or network fails)
    const nameLower = (fileName || '').toLowerCase();
    let guessedCategory = 'bills';
    let guessedMerchant = 'Utility Provider';
    let guessedMethod = 'UPI';

    if (nameLower.includes('food') || nameLower.includes('swiggy') || nameLower.includes('zomato') || nameLower.includes('restaurant')) {
      guessedCategory = 'food';
      guessedMerchant = 'Food & Dining';
    } else if (nameLower.includes('amazon') || nameLower.includes('flipkart') || nameLower.includes('shop')) {
      guessedCategory = 'shopping';
      guessedMerchant = 'Retail Merchant';
    } else if (nameLower.includes('uber') || nameLower.includes('ola') || nameLower.includes('fuel')) {
      guessedCategory = 'transport';
      guessedMerchant = 'Ride / Fuel Station';
    } else if (nameLower.includes('elect') || nameLower.includes('power')) {
      guessedCategory = 'electricity';
      guessedMerchant = 'Electricity Board';
    } else if (nameLower.includes('wifi') || nameLower.includes('broadband') || nameLower.includes('airtel') || nameLower.includes('jio')) {
      guessedCategory = 'broadband';
      guessedMerchant = 'Telecom / Broadband';
    }

    return {
      data: {
        merchant: guessedMerchant,
        amount: undefined, // Let user enter or confirm
        currency: 'INR',
        date: new Date().toISOString().split('T')[0],
        category: guessedCategory,
        paymentMethod: guessedMethod,
        description: `Bill: ${fileName || 'Uploaded Bill'}`,
        notes: 'Attached receipt uploaded',
        confidence: 0.5,
        isSimulated: true,
        message: apiKey
          ? 'Gemini vision service temporarily busy. Please verify bill details manually.'
          : 'Gemini API Key is not set. Add GEMINI_API_KEY to your .env file for live AI OCR.',
      },
      receiptUrl,
    };
  },
};
