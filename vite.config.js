import { defineConfig } from 'vite';

const boostrPwaPlugin = {
  name: 'boostr-pwa-shell',
  transformIndexHtml() {
    return {
      tags: [
        {
          tag: 'link',
          attrs: { rel: 'manifest', href: '/manifest.webmanifest' },
          injectTo: 'head'
        },
        {
          tag: 'link',
          attrs: { rel: 'apple-touch-icon', href: '/assets/icons/09.-b-star-favicon.png' },
          injectTo: 'head'
        },
        {
          tag: 'link',
          attrs: { rel: 'stylesheet', href: '/pwa.css' },
          injectTo: 'head'
        },
        {
          tag: 'meta',
          attrs: { name: 'theme-color', content: '#050505' },
          injectTo: 'head'
        },
        {
          tag: 'meta',
          attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' },
          injectTo: 'head'
        },
        {
          tag: 'meta',
          attrs: { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
          injectTo: 'head'
        },
        {
          tag: 'meta',
          attrs: { name: 'apple-mobile-web-app-title', content: 'BOOSTR Labs' },
          injectTo: 'head'
        },
        {
          tag: 'script',
          attrs: { src: '/pwa-register.js', defer: true },
          injectTo: 'body'
        }
      ]
    };
  }
};

export default defineConfig({
  base: '/',
  plugins: [boostrPwaPlugin],
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
