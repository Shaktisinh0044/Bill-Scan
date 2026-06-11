// BillScan — Secure Backend (v3 — stronger prompt + Type field)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { images } = req.body;
    if (!images || images.length === 0) return res.status(400).json({ error: 'No images provided' });

    const prompt = `You are an EXPERT at reading handwritten Indian bike spare parts bills. You read messy Gujarati-influenced English handwriting daily. Read SLOWLY and CAREFULLY, line by line.

THIS BILL IS FROM A BIKE PARTS WHOLESALER. Every line item has a TYPE (category) and PRODUCT name.

THE 9 VALID TYPES (memorize these — every item belongs to one):
1. F/M (Front Mudguard)
2. H/L VISOR (Headlight Visor)
3. H.L. VISOR GLASS
4. T.P. (Tail Panel)
5. S.P. (Side Panel)
6. FRONT COWL
7. LOWER
8. MITOR COVER
9. CROME PATTI

HANDWRITING PATTERNS IN THESE BILLS:
- Type is written at LEFT of each line, often abbreviated: "F/M", "Visor", "TIP" (=T.P.), "SIP" (=S.P.), "H/L"
- Type may be written ONCE then ditto marks (") or dashes for following lines — those lines have SAME type as line above
- Products: SPL/SPLANDOR=Splendor, DLX=Deluxe, N/M=New Model, A/W=All Weather, HF=Hero HF, CT100, PLATINA, PULSAR, DISCOVER, MAESTRO, PLEASURE, ACTIVA, SHINE, DREAM, BOXER
- Bottom of bill may have: BILLING NO, TAX, TOTAL, party name, date

COLUMN ORDER — READ CAREFULLY, THIS IS WHERE MISTAKES HAPPEN:
Each line reads LEFT to RIGHT: [Type] [Product] [QTY] [RATE] [AMOUNT]
- QTY is the SMALL number: almost always 1 to 50 pieces. Written as "15 Pc", "7 Set", "2 st", or just a small number.
- RATE is the MEDIUM number: price per piece, usually 85 to 1500.
- AMOUNT is the LARGEST number, at FAR RIGHT of the line.
- NEVER put the same number in both qty and rate. If you find yourself writing qty=250 rate=250, you misread — go back and re-read that line.
- If qty looks bigger than 50, you probably grabbed the RATE by mistake. The small number near "Pc"/"Set" is the qty.
- Numbers: 1 and 7 look similar, 4 and 9 look similar.

MANDATORY SELF-CHECK before final answer — for EVERY line:
1. Does qty × rate = amount? If not, one number is wrong.
2. The AMOUNT written on the page is the truth. Derive qty = amount ÷ rate. If that gives a clean small number (1-50), use that as qty.
3. Is qty between 1 and 50? If qty > 100, you misread — fix it using amount ÷ rate.

MULTI-PAGE: If multiple images, they are pages of ONE bill. Combine ALL items in order.

FIRST CHECK: If image is NOT a bill (selfie, scenery, random object) respond EXACTLY:
{"error":"not_a_bill"}

OTHERWISE respond ONLY valid JSON (no markdown, no explanation, no backticks):
{
  "party": "customer/party name if visible else empty string",
  "date": "date if visible else empty string",
  "invoice_no": "invoice number if visible else empty string",
  "billing_no": "billing number if visible else empty string",
  "items": [
    {"sr": 1, "type": "ONE OF THE 9 VALID TYPES", "product": "product name WITHOUT the type prefix", "qty": 0, "rate": 0, "amount": 0}
  ]
}

CRITICAL: "type" and "product" are SEPARATE fields. Example: handwritten "F/M CD DLX 15 Pc 165 2475" becomes {"sr":1,"type":"F/M","product":"CD DLX","qty":15,"rate":165,"amount":2475}`;

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
        max_tokens: 3000,
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
