// File: api/send-chat.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { inputs } = req.body;
  const token = process.env.HF_TOKEN;

  if (!token) {
    return res.status(500).json({ message: 'Token Rahasia tidak ditemukan.' });
  }

  try {
    // MODEL: MISTRAL 7B INSTRUCT V0.3
    const MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.3";
    const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ViralScope-AI/1.0'
      },
      body: JSON.stringify({ 
        inputs: inputs,
        parameters: {
            max_new_tokens: 256,
            temperature: 0.7,
            return_full_text: false
        }
      })
    });

    const rawResponse = await response.text();

    if (!response.ok) {
      console.error(`HF Error ${response.status}:`, rawResponse);
      
      // Jika error 503 (Loading), beri pesan khusus
      if (response.status === 503) {
        return res.status(503).json({ message: 'Model sedang loading (Cold Start). Tunggu 30 detik lalu coba lagi!' });
      }

      // PENTING: Jangan paksa parse JSON jika errornya teks biasa
      // Cek apakah responsnya valid JSON sebelum di-parse
      let errorMessage = rawResponse;
      try {
        const jsonError = JSON.parse(rawResponse);
        if (jsonError.error) errorMessage = jsonError.error;
      } catch (e) {
        // Jika gagal parse JSON, gunakan teks mentah dari server
        errorMessage = `Server Error: ${rawResponse.substring(0, 100)}...`; 
      }

      return res.status(response.status).json({ message: errorMessage });
    }

    // Jika sukses (200), baru kita parse JSON
    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch (e) {
      console.error("Gagal parse JSON respons sukses:", rawResponse);
      return res.status(500).json({ message: 'Format respons AI rusak.' });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Server Crash:', error);
    return res.status(500).json({ message: 'Gagal connect ke AI: ' + error.message);
  }
}
