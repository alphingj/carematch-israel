import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {vitePrerenderPlugin} from 'vite-prerender-plugin';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      vitePrerenderPlugin({
        renderTarget: '#root',
        prerenderScript: path.resolve(__dirname, 'src/prerender.tsx'),
      }),
    ],
    define: {
      'process.env.apiKey': JSON.stringify(env.apiKey),
      'process.env.authDomain': JSON.stringify(env.authDomain),
      'process.env.projectId': JSON.stringify(env.projectId),
      'process.env.storageBucket': JSON.stringify(env.storageBucket),
      'process.env.messagingSenderId': JSON.stringify(env.messagingSenderId),
      'process.env.appId': JSON.stringify(env.appId),
      'process.env.measurementId': JSON.stringify(env.measurementId),
      'process.env.VITE_VAPID_KEY': JSON.stringify(env.VITE_VAPID_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
