// File: api/generate-image.js
// Vercel Edge Function - Proxy ke Pollinations API

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Hanya terima GET request
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const prompt = url.searchParams.get('prompt');
  const width = parseInt(url.searchParams.get('width')) || 1024;
  const height = parseInt(url.searchParams.get('height')) || 1024;
  const model = url.searchParams.get('model') || 'flux';
  const seed = url.searchParams.get('seed') || Math.floor(Math.random() * 1000000);
  const userKey = url.searchParams.get('user_key');

  // Validasi prompt
  if (!prompt || prompt.trim() === '') {
    return new Response(JSON.stringify({ error: 'Prompt required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Pilih API Key: User (BYOP) atau Server (Free Tier)
  const apiKey = userKey?.startsWith('pk_') ? userKey : process.env.POLLINATIONS_KEY;

  if (!apiKey) {
    console.error('POLLINATIONS_KEY not configured');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build URL ke Pollinations
  const params = new URLSearchParams({
    width: width.toString(),
    height: height.toString(),
    seed: seed.toString(),
    model: model,
    nologo: 'true',
    enhance: 'true',
    key: apiKey,
  });

  const pollinationsUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt.trim())}?${params.toString()}`;

  try {
    const response = await fetch(pollinationsUrl, {
      method: 'GET',
      headers: {},
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`Pollinations error ${response.status}:`, errText);
      
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: 'Invalid API key' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Pollen balance low' }), {
          status: 402,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: `Generation failed: ${response.status}`,
        details: errText.slice(0, 200)
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ambil image blob
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // Return langsung ke client
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
