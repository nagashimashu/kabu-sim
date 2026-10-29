import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' で相対パス出力 → GitHub Pages のサブパスでもそのまま動く
export default defineConfig({
  base: './',
  plugins: [react()],
});
