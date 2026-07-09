import { defineConfig } from 'vite';
import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function copyJohankarrdBuildr() {
  return {
    name: 'copy-johankarrd-buildr',
    closeBundle() {
      const source = resolve(process.cwd(), 'johankarrdbuildr');
      const target = resolve(process.cwd(), 'dist', 'johankarrdbuildr');
      if (existsSync(source)) {
        cpSync(source, target, { recursive: true, force: true });
      }
    }
  };
}

export default defineConfig({
  base: '/',
  plugins: [copyJohankarrdBuildr()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    host: '127.0.0.1',
    port: 5173
  },
  preview: {
    host: '127.0.0.1',
    port: 4173
  }
});
