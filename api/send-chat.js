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
    return res.status(500).json({ message: 'Token Rahasia tidak ditemukan.' });
  }

  try {
    // GANTI MODEL KE MISTRAL 7B INSTRUCT V0.3
    // Model ini sangat stabil, cepat, dan hampir pasti ada di Router Gratisan.
    const MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.3";
    
    // URL Router Wajib
    const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

    console.log("Mengirim chat ke Mistral:", API_URL);

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
      console.error(`Mistral Error ${response.status}:`, rawResponse);
      
      if (response.status === 404) {
        return res.status(404).json({ message: 'Model Mistral tidak ditemukan. Coba lagi nanti.' });
      }
      if (response.status === 401) {
        return res.status(401).json({ message: 'Token Invalid.' });
      }
      if (response.status === 503) {
        return res.status(503).json({ message: 'Model sedang loading. Tunggu 30 detik lalu coba lagi!' });
      }
      
      return res.status(response.status).json({ message: `Error AI: ${rawResponse}` });
    }

    const data = JSON.parse(rawResponse);
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server Crash:', error);
    return res.status(500).json({ message: 'Gagal connect ke AI: ' + error.message);
  }
}
