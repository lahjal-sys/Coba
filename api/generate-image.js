// File: api/generate-image.js
// Backend untuk Generate Gambar menggunakan DeepAI API (Versi Fixed & Improved)

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { prompt, width = 512, height = 512, grid_size = 1 } = req.body;
  const apiKey = process.env.DEEPAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: 'Konfigurasi Server Error: DEEPAI_API_KEY tidak ditemukan di Vercel.' });
  }

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ message: 'Prompt wajib diisi dan harus string!' });
  }

  // Validasi sederhana width & height (sesuai docs DeepAI)
  const w = Math.max(128, Math.min(1536, Number(width) || 512));
  const h = Math.max(128, Math.min(1536, Number(height) || 512));
  
  // Pastikan kelipatan 32
  const finalWidth = Math.round(w / 32) * 32;
  const finalHeight = Math.round(h / 32) * 32;

  try {
    const apiUrl = 'https://api.deepai.org/api/text2img';

    const formData = new FormData();
    formData.append('text', prompt);
    formData.append('width', finalWidth.toString());
    formData.append('height', finalHeight.toString());
    formData.append('grid_size', grid_size.toString()); // 1 = satu gambar, 2 = grid 2x2

    console.log(`Mengirim ke DeepAI → prompt: "${prompt.slice(0, 100)}...", size: ${finalWidth}x${finalHeight}, grid: ${grid_size}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || data.err) {
      console.error("DeepAI Error:", data);
      return res.status(response.status || 400).json({ 
        message: `DeepAI Error: ${data.err || data.error || 'Unknown error'}` 
      });
    }

    if (!data.output_url) {
      throw new Error("Tidak ada output_url dari DeepAI.");
    }

    // Download gambar (proxy)
    const imageResponse = await fetch(data.output_url);
    if (!imageResponse.ok) {
      throw new Error(`Gagal download gambar: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Kirim gambar ke frontend
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache, private');
    res.setHeader('Content-Length', imageBuffer.byteLength);
    
    return res.status(200).send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Image Gen Crash:', error);
    return res.status(500).json({ 
      message: 'Gagal generate gambar: ' + error.message 
    });
  }
}
