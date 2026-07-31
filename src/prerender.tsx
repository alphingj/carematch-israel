import { renderToReadableStream } from 'react-dom/server';
import App from './App.tsx';

export async function prerender() {
  const stream = await renderToReadableStream(<App />);
  const html = await new Response(stream).text();
  return { html };
}
