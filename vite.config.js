import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { target: 'es2022', manifest: true },
  // Libraries reached only through import(): bundle them up front so the dev server doesn't
  // discover them mid-run and reload the page.
  optimizeDeps: { include: ['@tonejs/midi', 'mediabunny'] },
  server: { port: 5180 },
  test: {
    include: ['src/**/*.test.{js,jsx}'],
  },
});
