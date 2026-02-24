// File: api/generate-image.js
// Backend Gambar menggunakan Pollinations.ai VIA PROXY (Anti Block 530)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { prompt, width, height } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt wajib diisi!' });
  }

  try {
    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 1000000);
    
    // URL Asli Pollinations
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width || 1024}&height=${height || 1024}&seed=${seed}&nologo=true&model=flux`;

    // KITA PAKAI PROXY ALLORIGINS UNTUK MENGHINDARI BLOKIR IP VERCEL
    // AllOrigins akan mengambil gambar dari Pollinations lalu meneruskannya ke kita
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(pollinationsUrl)}`;

    console.log("Mengambil gambar via Proxy:", proxyUrl);

    const imageResponse = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' // Menyamar sebagai browser biasa
      }
    });

    if (!imageResponse.ok) {
      throw new Error(`Gagal mengambil gambar: ${imageResponse.status} ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache, private');
    return res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Image Gen Crash:', error);
    return res.status(500).json({ message: 'Gagal generate gambar: ' + error.message });
  }
}
