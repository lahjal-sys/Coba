// File: api/send-chat.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { inputs } = req.body;
  const token = process.env.HF_TOKEN;

  if (!token) return res.status(500).json({ message: 'Token tidak ditemukan di server' });

  try {
    const MODEL_ID = "meta-llama/Meta-Llama-3-8B-Instruct";
    // Pastikan URL ini benar sesuai standar router terbaru
    const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

    console.log("Mengirim request ke HF:", API_URL); // Log untuk debugging

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
      
      if (response.status === 404) {
          return res.status(404).json({ message: 'Model Chat tidak ditemukan. Cek nama model.' });
      }
      if (response.status === 401) {
          return res.status(401).json({ message: 'Token tidak valid.' });
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
