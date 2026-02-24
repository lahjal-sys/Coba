// File: api/generate-image.js
export default async function handler(req, res) {
  // Setup CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { prompt, width, height } = req.body;
  const token = process.env.HF_TOKEN; 

  if (!token) {
    return res.status(500).json({ message: 'Token rahasia tidak ditemukan di server' });
  }

  try {
    // FORMAT URL BARU UNTUK ROUTER.HUGGINGFACE.CO
    // Perhatikan: Tidak ada kata 'models' di tengah jika pakai router spesifik, 
    // TAPI untuk inference umum, kita pakai format ini:
    const MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0";
    const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ViralScope-AI/1.0',
        // Header tambahan untuk memastikan request diterima
        'X-HF-Client': 'ViralScope-Vercel' 
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { 
            width: width || 1024, 
            height: height || 1024,
            num_inference_steps: 25 
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("HF Router Error:", response.status, errText);
      
      if (response.status === 404) {
          return res.status(404).json({ message: 'Model tidak ditemukan. Pastikan nama model benar.' });
      }
      if (response.status === 401) {
          return res.status(401).json({ message: 'Token tidak valid. Cek Environment Variable.' });
      }
      if (response.status === 503) {
          return res.status(503).json({ message: 'Model sedang loading. Coba lagi dalam 30 detik.' });
      }
      return res.status(response.status).json({ message: `Error AI: ${errText}` });
    }

    const imageBuffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, private');
    return res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Server Crash:', error);
    return res.status(500).json({ message: 'Gagal memproses permintaan.' });
  }
}
