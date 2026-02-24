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
    console.error("TOKEN TIDAK DITEMUKAN DI ENVIRONMENT VARIABLES");
    return res.status(500).json({ message: 'Konfigurasi Server Error: Token Hilang' });
  }

  try {
    // STRATEGI BARU: Gunakan endpoint inference standar yang masih work untuk server-side
    // Banyak laporan bahwa router.huggingface.co sering 404 untuk model tertentu.
    // Kita coba endpoint utama dengan header User-Agent yang kuat.
    const MODEL_ID = "meta-llama/Meta-Llama-3-8B-Instruct";
    const API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`;

    console.log(`Mengirim chat ke: ${API_URL}`);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ViralScope-AI-Production/1.0', 
        'X-HF-Client': 'Vercel-Serverless'
      },
      body: JSON.stringify({ 
        inputs: inputs,
        parameters: {
            max_new_tokens: 256,
            temperature: 0.7,
            return_full_text: false // Penting! Agar tidak mengulang prompt
        }
      })
    });

    const responseData = await response.text(); // Baca dulu sebagai text untuk debug

    if (!response.ok) {
      console.error(`HF Error ${response.status}:`, responseData);
      
      if (response.status === 404) {
        return res.status(404).json({ message: 'Model AI sedang tidur atau tidak ditemukan. Coba prompt lain.' });
      }
      if (response.status === 401) {
        return res.status(401).json({ message: 'Token Rahasia Salah/Kadaluarsa. Hubungi Admin.' });
      }
      if (response.status === 503) {
        return res.status(503).json({ message: 'Model sedang loading (Cold Boot). Tunggu 30 detik lalu coba lagi!' });
      }
      
      // Coba parse JSON jika errornya dalam format JSON
      try {
        const errJson = JSON.parse(responseData);
        return res.status(response.status).json({ message: `Error: ${errJson.error || responseData}` });
      } catch (e) {
        return res.status(response.status).json({ message: `Error Server: ${responseData}` });
      }
    }

    // Jika sukses, parse JSON
    const data = JSON.parse(responseData);
    return res.status(200).json(data);

  } catch (error) {
    console.error('CRITICAL SERVER ERROR:', error);
    return res.status(500).json({ message: 'Gagal terhubung ke otak AI.' });
  }
}
