// File: api/send-chat.js
export default async function handler(req, res) {
  // Izinkan akses dari domain mana saja (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { inputs } = req.body;
  const token = process.env.HF_TOKEN;

  if (!token) {
    console.error("TOKEN HILANG!");
    return res.status(500).json({ message: 'Token rahasia tidak ditemukan di server Vercel.' });
  }

  try {
    // KITA PAKAI MODEL GOOGLE GEMMA 2B (SANGAT RINGAN & STABIL)
    // DAN PAKAI ENDPOINT LANGSUNG (BUKAN ROUTER) AGAR LEBIH PASTI
    const MODEL_ID = "google/gemma-2b-it";
    
    // Coba endpoint inference standar dulu (seringkali masih jalan untuk server-side)
    let API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`;
    
    // Header wajib agar tidak diblokir sebagai bot
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'HuggingFace/1.0.0 (Node; Vercel)', 
      'X-HF-Client': 'ViralScope-Production'
    };

    // Payload chat
    const bodyData = JSON.stringify({ 
      inputs: inputs,
      parameters: {
        max_new_tokens: 200,
        temperature: 0.7,
        return_full_text: false 
      }
    });

    // Request ke Hugging Face
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: headers,
      body: bodyData
    });

    // Cek respons
    const rawText = await response.text();

    // JIKA ERROR 400/404 DARI ENDPOINT LAMA, COBA ALIH KE ROUTER OTOMATIS
    if (!response.ok && (response.status === 404 || response.status === 400)) {
       console.log("Endpoint lama gagal, mencoba router...");
       API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;
       
       const retryResponse = await fetch(API_URL, {
          method: 'POST',
          headers: headers,
          body: bodyData
       });
       
       const retryText = await retryResponse.text();
       if (!retryResponse.ok) {
          throw new Error(`Router Error ${retryResponse.status}: ${retryText}`);
       }
       return res.status(200).send(retryText);
    }

    // Jika endpoint pertama sukses
    if (!response.ok) {
       throw new Error(`Error ${response.status}: ${rawText}`);
    }

    return res.status(200).send(rawText);

  } catch (error) {
    console.error('CHAT CRASH:', error.message);
    return res.status(500).json({ message: 'Gagal connect ke AI: ' + error.message });
  }
}
