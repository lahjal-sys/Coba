// app/grok-chat/page.tsx
'use client';

import { useState } from 'react';

export default function GrokChat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/grok-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Gagal koneksi. Coba lagi.' }]);
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
      <h1>Grok Chat via Vercel Proxy</h1>
      <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ margin: '10px 0', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
            <strong>{msg.role === 'user' ? 'Kamu' : 'Grok'}: </strong>
            {msg.content}
          </div>
        ))}
        {loading && <p>Grok lagi mikir...</p>}
      </div>
      <div style={{ display: 'flex' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ketik pesan ke Grok..."
          style={{ flex: 1, padding: '10px', borderRadius: '8px 0 0 8px', border: '1px solid #ccc' }}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '0 8px 8px 0' }}
        >
          Kirim
        </button>
      </div>
      <p style={{ fontSize: '0.8em', color: '#666', marginTop: '10px' }}>
        API key aman di server-side Vercel env var (GROK_API_KEY).
      </p>
    </div>
  );
}
