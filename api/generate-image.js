// File: api/generate-image.js
export default async function handler(req, res) {
  // Izinkan CORS (agar frontend bisa akses)
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
    // KITA PAKAI ENDPOINT STANDAR YANG MASIH AKTIF UNTUK SERVER-SIDE
    // Menggunakan model SDXL yang stabil
    const MODEL_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

    const response = await fetch(MODEL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        // Tambahkan User-Agent agar tidak dikira bot jahat
        'User-Agent': 'ViralScope-AI/1.0' 
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { 
            width: width || 1024, 
            height: height || 1024,
            num_inference_steps: 30 // Kualitas standar
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      // Log error detail ke console Vercel (bisa dilihat di dashboard)
      console.error("HF Error:", response.status, errText);
      
      if (response.status === 404) {
          return res.status(404).json({ message: 'Model tidak ditemukan. Coba prompt lain.' });
      }
      if (response.status === 503) {
          return res.status(503).json({ message: 'Model sedang loading. Coba 30 detik lagi.' });
      }
      return res.status(response.status).json({ message: `Error dari AI: ${errText}` });
    }

    const imageBuffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, private'); // Jangan cache gambar hasil generate
    return res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Server Crash:', error);
    return res.status(500).json({ message: 'Gagal memproses permintaan.' });
  }
}
