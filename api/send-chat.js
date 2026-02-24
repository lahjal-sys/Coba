// File: api/send-chat.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { inputs } = req.body;
  const token = process.env.HF_TOKEN;

  if (!token) return res.status(500).json({ message: 'Token not found in server.' });

  try {
    // GUNAKAN MODEL PHI-3 MINI (PALING STABIL & CEPAT DI FREE TIER)
    const MODEL_ID = "microsoft/Phi-3-mini-4k-instruct";
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
      if (response.status === 404) return res.status(404).json({ message: 'Model not found. Try again later.' });
      if (response.status === 401) return res.status(401).json({ message: 'Invalid Token.' });
      if (response.status === 503) return res.status(503).json({ message: 'Model is loading. Wait 30s and retry!' });
      return res.status(response.status).json({ message: `Error: ${rawResponse}` });
    }

    const data = JSON.parse(rawResponse);
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server Crash:', error);
    return res.status(500).json({ message: 'Failed to process chat.' });
  }
}
