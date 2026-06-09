// Backend serverless function — runs on Vercel
// Your API key lives here, hidden from users

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // API key from environment variable (set in Vercel dashboard — NEVER in code)
  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  try {
    const { images } = req.body; // array of {mime, data}
    if (!images || images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const prompt = `You are a bill data extractor. Look at the handwritten bill photo(s) carefully and extract all data.

If there are multiple images, they are different PAGES of the SAME bill. Combine all items from all pages into one list.

FIRST CHECK: If the image is NOT a bill/invoice (no items, no amounts, random photo) — respond with exactly:
{"error":"not_a_bill"}

Otherwise return ONLY valid JSON, no markdown, no explanation:
{
  "party": "party or customer name if visible, else empty string",
  "date": "date if visible, else empty string",
  "invoice_no": "invoice or bill number if visible, else empty string",
  "billing_no": "billing number if visible, else empty string",
  "items": [
    {"sr": 1, "product": "product name exactly as written", "qty": 0, "rate": 0, "amount": 0}
  ]
}

Rules:
- Extract every single line item from all pages
- Keep product names exactly as written (SPL, DLX, F/M, H/L etc)
- qty = quantity number only
- rate = price per unit number only
- amount = total for that line (qty x rate, or as shown)
- Numbers only, no currency symbols`;

    // Build content array with all images + prompt
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
        max_tokens: 1500,
        messages: [{ role: 'user', content }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    let raw = data.content?.find(b => b.type === 'text')?.text || '';
    raw = raw.replace(/```json|```/g, '').trim();

    return res.status(200).json({ result: raw });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
