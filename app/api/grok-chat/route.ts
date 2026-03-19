// app/api/grok-chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json(); // Expect array messages seperti [{role: 'user', content: '...'}]

    const completion = await openai.chat.completions.create({
      model: 'grok-4-fast-non-reasoning', // atau model lain, cek docs.x.ai
      messages: [
        { role: 'system', content: 'Kamu adalah Grok, AI helpful, truthful, dan sedikit humoris dari xAI.' },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 512,
      stream: false, // ubah ke true kalau mau streaming response
    });

    const reply = completion.choices[0].message.content;

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Grok API error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal konek ke Grok API. Cek key/limit.' },
      { status: 500 }
    );
  }
}
