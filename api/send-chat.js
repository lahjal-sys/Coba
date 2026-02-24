// File: api/send-chat.js
export default async function handler(req, res) {
  // Setup CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { inputs } = req.body;
  const token = process.env.HF_TOKEN;

  if (!token) {
    return res.status(500).json({ message: 'Token Rahasia tidak ditemukan di Server Vercel.' });
  }

  try {
    // KONFIGURASI FINAL UNTUK ROUTER.HUGGINGFACE.CO
    // Gunakan Mistral 7B Instruct v0.3 (Sangat Stabil di Free Tier)
    const MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.3";
    
    // FORMAT URL YANG BENAR: https://router.huggingface.co/hf-inference/models/{MODEL_ID}
    const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

    console.log("Mengirim request ke Router HF:", API_URL);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ViralScope-AI-Vercel/1.0',
        // Header tambahan agar router mengenali ini request valid
        'X-HF-Client': 'Vercel-Serverless-Function'
      },
      body: JSON.stringify({ 
        inputs: inputs,
        parameters: {
            max_new_tokens: 256,   // Batasi panjang jawaban
            temperature: 0.7,      // Kreativitas seimbang
            return_full_text: false // Jangan kembalikan prompt asli
        }
      })
    });

    // Baca respons dulu sebagai text untuk debugging jika error
    const rawResponse = await response.text();

    if (!response.ok) {
      console.error(`Router Error ${response.status}:`, rawResponse);
      
      if (response.status === 404) {
        return res.status(404).json({ message: 'Model Chat tidak ditemukan di Router. Coba lagi nanti.' });
      }
      if (response.status === 401) {
        return res.status(401).json({ message: 'Token Invalid. Pastikan Token di Vercel Environment Variables benar.' });
      }
      if (response.status === 503) {
        return res.status(503).json({ message: 'Model sedang dimuat (Cold Start). Tunggu 30 detik lalu kirim pesan lagi!' });
      }

      // Coba parse jika errornya JSON
      try {
        const errJson = JSON.parse(rawResponse);
        return res.status(response.status).json({ message: `Error: ${errJson.error || rawResponse}` });
      } catch (e) {
        return res.status(response.status).json({ message: `Error Server: ${rawResponse}` });
      }
    }

    // Jika sukses (status 200), parse JSON
    const data = JSON.parse(rawResponse);
    return res.status(200).json(data);

  } catch (error) {
    console.error('CRITICAL SERVER CRASH:', error);
    return res.status(500).json({ message: 'Gagal memproses permintaan chat.' });
  }
}
