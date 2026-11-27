import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { target: 'es2022', manifest: true },
  worker: { format: 'es' },
  // The note finder's libraries are only reached from a worker; bundle them up front so the
  // dev server doesn't discover them mid-run and reload the page.
  optimizeDeps: { include: ['@tensorflow/tfjs', '@spotify/basic-pitch', '@tonejs/midi', 'mediabunny'] },
  server: { port: 5180 },
  test: {
    include: ['src/**/*.test.{js,jsx}'],
  },
});
