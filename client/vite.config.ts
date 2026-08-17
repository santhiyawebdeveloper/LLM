import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'inject-shopify-api-key',
        transformIndexHtml(html) {
          const apiKey =
            env.VITE_SHOPIFY_API_KEY ||
            process.env.VITE_SHOPIFY_API_KEY ||
            process.env.SHOPIFY_API_KEY ||
            '';
          return html.replace(/%VITE_SHOPIFY_API_KEY%/g, apiKey);
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
