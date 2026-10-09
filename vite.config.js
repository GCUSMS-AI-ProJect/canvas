import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  base: '/draw/',
  build: {
    outDir: 'dist/draw', emptyOutDir: true, copyPublicDir: false,
    sourcemap: false, chunkSizeWarningLimit: 3000,
    rollupOptions: {input: {
      home: fileURLToPath(new URL('./index.html', import.meta.url)),
      editor: fileURLToPath(new URL('./editor.html', import.meta.url)),
    }},
  },
  server: {host: '127.0.0.1', proxy: {'/api': 'http://127.0.0.1:8082'}},
});
