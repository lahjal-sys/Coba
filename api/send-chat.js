// File: api/send-chat.js
// Backend untuk Chat menggunakan Groq API (Super Cepat & Gratis)

export default async function handler(req, res) {
  // Setup CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { inputs } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: 'Konfigurasi Server Error: GROQ_API_KEY tidak ditemukan.' });
  }

  try {
    // MODEL: LLAMA 3.1 8B INSTANT (Tercepat & Kuota Besar)
    const MODEL_ID = "llama-3.1-8b-instant";
    const API_URL = "https://api.groq.com/openai/v1/chat/completions";

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          { role: "system", content: "You are a helpful, friendly, and concise assistant." },
          { role: "user", content: inputs }
        ],
        temperature: 0.7,
        max_tokens: 512 // Batasi jawaban agar tidak terlalu panjang
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq Error:", data);
      if (data.error && data.error.message) {
        return res.status(response.status).json({ message: `Groq Error: ${data.error.message}` });
      }
      throw new Error(`Groq API Error: ${response.status}`);
    }

    // Groq mengembalikan format: { choices: [{ message: { content: "..." } }] }
    const reply = data.choices[0].message.content;
    
    return res.status(200).json({ result: reply });

  } catch (error) {
    console.error('Server Crash:', error);
    return res.status(500).json({ message: 'Gagal connect ke Groq: ' + error.message });
  }
}
