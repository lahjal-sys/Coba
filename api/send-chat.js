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
    // MODEL FINAL: META LLAMA 3 (PALING STABIL DI ROUTER)
    const MODEL_ID = "meta-llama/Meta-Llama-3-8B-Instruct";
    
    // URL WAJIB: Router Hugging Face dengan path /hf-inference/models/
    const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

    console.log("Mengirim chat ke Router HF:", API_URL);

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
            return_full_text: false
        }
      })
    });

    const rawResponse = await response.text();

    if (!response.ok) {
      console.error(`Router Error ${response.status}:`, rawResponse);
      
      if (response.status === 404) {
        return res.status(404).json({ message: 'Model Llama 3 tidak ditemukan di Router. Pastikan Token aktif.' });
      }
      if (response.status === 401) {
        return res.status(401).json({ message: 'Token Invalid. Cek Environment Variables di Vercel.' });
      }
      if (response.status === 503) {
        return res.status(503).json({ message: 'Model sedang loading (Cold Start). Tunggu 30 detik lalu coba lagi!' });
      }
      
      return res.status(response.status).json({ message: `Error AI: ${rawResponse}` });
    }

    const data = JSON.parse(rawResponse);
    return res.status(200).json(data);

  } catch (error) {
    console.error('CRITICAL SERVER CRASH:', error);
    return res.status(500).json({ message: 'Gagal terhubung ke otak AI: ' + error.message });
  }
}
