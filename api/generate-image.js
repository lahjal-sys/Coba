// File: api/generate-image.js
// Backend untuk Generate Gambar menggunakan DeepAI API

export default async function handler(req, res) {
  // Setup CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { prompt, width, height } = req.body;
  const apiKey = process.env.DEEPAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: 'Konfigurasi Server Error: DEEPAI_API_KEY tidak ditemukan di Vercel.' });
  }

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt wajib diisi!' });
  }

  try {
    // DeepAI Endpoint untuk Text-to-Image
    const apiUrl = 'https://api.deepai.org/api/text2img';

    // DeepAI menerima data dalam format FormData, bukan JSON biasa
    const formData = new FormData();
    formData.append('text', prompt);
    
    // DeepAI gratisan biasanya mengabaikan parameter size spesifik 
    // atau punya rasio tetap, tapi kita coba kirim saja sebagai hint
    // Catatan: DeepAI free tier mungkin menghasilkan gambar ukuran standar (512x512)
    
    console.log("Mengirim prompt ke DeepAI:", prompt);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'api-key': apiKey // Header wajib DeepAI
        // Jangan set 'Content-Type': 'multipart/form-data' secara manual, 
        // browser/fetch akan otomatis membuatnya saat pakai FormData
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("DeepAI Error:", data);
      if (data.err) {
        return res.status(response.status).json({ message: `DeepAI Error: ${data.err}` });
      }
      throw new Error(`DeepAI API Error: ${response.status}`);
    }

    // DeepAI mengembalikan JSON berisi URL gambar: { output_url: "https://..." }
    if (!data.output_url) {
      throw new Error("Tidak ada URL gambar dari DeepAI.");
    }

    const imageUrl = data.output_url;
    console.log("Gambar berhasil dibuat:", imageUrl);

    // Sekarang kita download gambar dari URL tersebut agar bisa dikirim balik sebagai blob
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Gagal mengunduh gambar dari server DeepAI.");
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/png';

    // Kirim balik gambar binary ke frontend
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache, private');
    return res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Image Gen Crash:', error);
    return res.status(500).json({ message: 'Gagal generate gambar: ' + error.message });
  }
}
