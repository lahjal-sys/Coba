// File: api/send-chat.js
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

  const { inputs } = req.body;
  const token = process.env.HF_TOKEN; // Pakai token yang sama (sudah aman di Vercel)

  if (!token) {
    return res.status(500).json({ message: 'Token tidak ditemukan di server' });
  }

  try {
    // Gunakan endpoint router yang sama (sudah terbukti berhasil)
    const MODEL_ID = "meta-llama/Meta-Llama-3-8B-Instruct";
    const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ViralScope-AI/1.0'
      },
      body: JSON.stringify({ inputs: inputs })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("HF Chat Error:", response.status, errText);
      
      if (response.status === 401) {
          return res.status(401).json({ message: 'Token tidak valid.' });
      }
      if (response.status === 503) {
          return res.status(503).json({ message: 'Model chat sedang loading. Coba lagi.' });
      }
      return res.status(response.status).json({ message: `Error AI: ${errText}` });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server Crash:', error);
    return res.status(500).json({ message: 'Gagal memproses chat.' });
  }
}
