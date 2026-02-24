// File: api/generate-image.js
export default async function handler(req, res) {
  // 1. Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 2. Ambil data dari frontend
  const { prompt, width, height } = req.body;

  // 3. Ambil Token Rahasia dari Vercel Environment Variables
  const token = process.env.HF_TOKEN; 

  if (!token) {
    return res.status(500).json({ message: 'Server error: Token tidak ditemukan' });
  }

  try {
    // 4. PERBAIKAN DI SINI: Ganti URL ke router.huggingface.co
    const response = await fetch(
      'https://router.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Wait-For-Model': 'true'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { width, height }
        })
      }
    );

    // 5. Handle Error
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ message: `Gagal: ${errorText}` });
    }

    // 6. Kirim Gambar Balik
    const imageBuffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Error generating image:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
}
