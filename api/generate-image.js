// File: api/generate-image.js
// Backend untuk Generate Gambar menggunakan Pollinations.ai (Gratis & Tanpa Token)

export default async function handler(req, res) {
  // Setup CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { prompt, width, height } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt wajib diisi!' });
  }

  try {
    // POLLINATIONS.AI URL FORMAT
    // Kita encode prompt agar aman untuk URL
    const encodedPrompt = encodeURIComponent(prompt);
    
    // Tambahkan seed random agar setiap request unik (tidak cache)
    const seed = Math.floor(Math.random() * 1000000);
    
    // URL Gambar Langsung dari Pollinations
    // Model default mereka sangat bagus (berbasis Flux/SDXL)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width || 1024}&height=${height || 1024}&seed=${seed}&nologo=true`;

    console.log("Mengambil gambar dari:", imageUrl);

    // Fetch gambar sebagai blob/binary
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Gagal mengambil gambar: ${imageResponse.status}`);
    }

    // Ambil data binary gambar
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Tentukan tipe konten (Pollinations biasanya mengembalikan JPEG/PNG)
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Kirim balik gambar ke frontend
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache, private'); // Jangan cache agar selalu baru
    return res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Image Gen Crash:', error);
    return res.status(500).json({ message: 'Gagal generate gambar: ' + error.message });
  }
}
