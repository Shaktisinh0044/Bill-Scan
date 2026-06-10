//BillScan — Secure Backend
// API key hidden here via environment variable

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { images } = req.body;
    if (!images || images.length === 0) return res.status(400).json({ error: 'No images provided' });

    const prompt = `You are an expert at reading handwritten Indian bike parts bills/invoices.

This bill is from an auto parts supplier. Products are bike accessories with these EXACT category prefixes:
- F/M = Front Mudguard
- H/L VISOR = Headlight Visor  
- T.P. = Tail Panel
- S.P. = Side Panel

READING RULES:
1. Product name always starts with category prefix: "F/M CD DLX", "H/L VISOR PLATINA", "T.P. HF DLX", "S.P. SPL PRO"
2. Quantity written as "15 Pc", "10 Pc", "2 Pc" — extract the NUMBER only
3. Rate is price per piece — extract as number only
4. Amount = qty x rate — extract as number only
5. Common abbreviations: SPL=Splendor, DLX=Deluxe, N/M=New Model, A/W=All Weather, HF=Hero Honda HF
6. If multiple pages, combine ALL items from ALL pages into one list
7. Billing No may be written as "BILLING-XXX" or "BILL NO XXX"

FIRST CHECK: If image has NO bill items (random photo, selfie, scenery) respond EXACTLY:
{"error":"not_a_bill"}

Otherwise respond ONLY with valid JSON, no markdown, no explanation:
{
  "party": "customer name if visible else empty string",
  "date": "date if visible else empty string", 
  "invoice_no": "invoice number if visible else empty string",
  "billing_no": "billing number if visible else empty string",
  "items": [
    {"sr": 1, "product": "EXACT product name with category prefix", "qty": 0, "rate": 0, "amount": 0}
  ]
}`;

    const content = images.map(img => ({
      type: 'image',
      source: { type: 'base64', media_type: img.mime, data: img.data }
    }));
    content.push({ type: 'text', text: prompt });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    let raw = data.content?.find(b => b.type === 'text')?.text || '';
    raw = raw.replace(/```json|```/g, '').trim();

    return res.status(200).json({ result: raw });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

