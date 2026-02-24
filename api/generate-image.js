// File: api/generate-image.js
// Ini adalah kode SERVER. User tidak akan pernah melihat kode ini.

export default async function handler(req, res) {
  // 1. Hanya izinkan metode POST (agar aman)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 2. Ambil data yang dikirim frontend (prompt, lebar, tinggi)
  const { prompt, width, height } = req.body;

  // 3. Ambil Token Rahasia dari "Brankas" Vercel
  const token = process.env.HF_TOKEN; 

  if (!token) {
    return res.status(500).json({ message: 'Server error: Token tidak ditemukan' });
  }

  try {
    // 4. Server kita menghubungi Hugging Face (bukan user langsung)
    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, // Pakai token rahasia
          'Content-Type': 'application/json',
          'X-Wait-For-Model': 'true' // Suruh HF tunggu sampai model siap
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { width, height }
        })
      }
    );

    // 5. Jika gagal, kirim pesan error ke frontend
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ message: `Gagal: ${errorText}` });
    }

    // 6. Jika berhasil, ambil gambarnya (dalam bentuk buffer/biner)
    const imageBuffer = await response.arrayBuffer();
    
    // 7. Kirim balik gambar itu ke frontend
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Error generating image:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
}
