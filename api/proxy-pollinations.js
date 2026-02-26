// File: api/proxy-pollinations.js
// Proxy untuk Pollinations Enterprise API (Menggunakan API Key Rahasia)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  const apiKey = process.env.PLN_APPS_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: 'API Key Pollinations tidak dikonfigurasi di server.' });
  }

  try {
    const { prompt, width, height, seed, model, nologo } = req.query;

    if (!prompt) return res.status(400).json({ message: 'Prompt wajib diisi' });

    // URL Enterprise Pollinations
    const baseUrl = 'https://enter.pollinations.ai/api';
    const targetPath = `/prompt/${encodeURIComponent(prompt)}`;
    
    const queryParams = new URLSearchParams({
      width: width || '1024',
      height: height || '1024',
      seed: seed || Math.floor(Math.random() * 1000000).toString(),
      model: model || 'flux',
      nologo: nologo || 'true',
    });

    const targetUrl = `${baseUrl}${targetPath}?${queryParams.toString()}`;
    console.log("Proxying to Enterprise:", targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'ViralScope-AI/1.0'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Enterprise Error ${response.status}: ${errText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=60');
    return res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Proxy Crash:', error);
    return res.status(500).json({ message: 'Gagal proxy: ' + error.message });
  }
}
