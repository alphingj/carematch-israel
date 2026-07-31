import { renderToReadableStream } from 'react-dom/server';
import App from './App.tsx';

export async function prerender() {
  try {
    const stream = await renderToReadableStream(<App />);
    const html = await new Response(stream).text();
    return { html };
  } catch (error) {
    console.error('[prerender] failed, falling back to SPA shell:', error);
    return { html: '' };
  }
}
