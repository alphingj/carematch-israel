import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.apiKey': JSON.stringify(process.env.apiKey),
      'process.env.authDomain': JSON.stringify(process.env.authDomain),
      'process.env.projectId': JSON.stringify(process.env.projectId),
      'process.env.storageBucket': JSON.stringify(process.env.storageBucket),
      'process.env.messagingSenderId': JSON.stringify(process.env.messagingSenderId),
      'process.env.appId': JSON.stringify(process.env.appId),
      'process.env.measurementId': JSON.stringify(process.env.measurementId),
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
      'process.env.VITE_VAPID_KEY': JSON.stringify(process.env.VITE_VAPID_KEY),
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
