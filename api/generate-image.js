// File: api/generate-image.js
// Vercel Node.js Serverless Function - Pollinations Proxy

export default async function handler(req, res) {
  // Hanya terima GET request
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, width, height, model, seed, user_key } = req.query;

    // Validasi prompt
    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ error: 'Prompt required' });
    }

    // Parse parameters
    const w = parseInt(width) || 1024;
    const h = parseInt(height) || 1024;
    const s = seed || Math.floor(Math.random() * 1000000);
    const m = model || 'flux';

    // Pilih API Key: User (BYOP) atau Server (Free Tier)
    const apiKey = user_key?.startsWith('pk_') ? user_key : process.env.POLLINATIONS_KEY;

    if (!apiKey) {
      console.error('POLLINATIONS_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Build URL ke Pollinations
    const params = new URLSearchParams({
      width: w.toString(),
      height: h.toString(),
      seed: s.toString(),
      model: m,
      nologo: 'true',
      enhance: 'false',
      key: apiKey,
    });

    const pollinationsUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt.trim())}?${params.toString()}`;

    // Forward request ke Pollinations
    const response = await fetch(pollinationsUrl, {
      method: 'GET',
      headers: { 'Accept': 'image/*' },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`Pollinations error ${response.status}:`, errText);

      if (response.status === 401) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      if (response.status === 402) {
        return res.status(402).json({ error: 'Pollen balance low' });
      }
      if (response.status === 400) {
        return res.status(400).json({ error: 'Invalid parameters' });
      }

      return res.status(502).json({
        error: `Generation failed: ${response.status}`,
        details: errText.slice(0, 200),
      });
    }

    // Ambil buffer gambar dan kirim ke client
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/png';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(buffer);

  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
