import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

/**
 * Emits `404.html` as a byte-for-byte copy of the built `index.html`.
 *
 * GitHub Pages serves 404.html for any path it has no file for. Because this
 * app routes on the client, a deep link (or a refresh on a routed URL) would
 * otherwise land on GitHub's own "page not found" instead of the app. Copying
 * index.html means the app boots and handles the route itself.
 *
 * This lives in the build rather than the deploy script so the published
 * output is self-contained: the file cannot go missing because a publish step
 * forgot to recreate it, and it can never reference a stale asset hash.
 */
function spaFallback(): Plugin {
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = bundle['index.html'];
      if (!html || html.type !== 'asset') {
        this.warn('index.html not found in the bundle; skipping 404.html');
        return;
      }
      this.emitFile({ type: 'asset', fileName: '404.html', source: html.source });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    spaFallback(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // React and its renderer are the biggest thing in the bundle and they
        // only change when the dependency is upgraded, so they get their own
        // chunk. Browsers then keep it cached across deploys instead of
        // re-downloading it every time a manager or an animation is edited.
        manualChunks: (id) => {
          // The editorial copy — formation write-ups, manager histories and
          // the guide — is a third of the bundle and gets edited far more
          // often than the app code around it. Its own chunk means a wording
          // change does not invalidate the app chunk in everyone's cache, and
          // the two download in parallel rather than one after the other.
          if (/[\\/]src[\\/](?:formation-content|guide-content|managers)\.ts$/.test(id)) {
            return 'editorial';
          }
          if (!id.includes('node_modules')) return undefined;

          // Match on the package directory rather than a bare substring, so
          // packages that merely contain "react" in their name (react-query,
          // lucide-react, react-hook-form, ...) stay in the app chunk.
          return /[\\/]node_modules[\\/](?:react|react-dom|scheduler)[\\/]/.test(id)
            ? 'react-vendor'
            : undefined;
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
