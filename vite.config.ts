import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // CRITICAL: Deduplicate React across ALL pre-bundled deps in dev mode.
  // `resolve.dedupe` forces every package (react-router, radix-ui, etc.) to
  // resolve react/react-dom to the SAME physical file, eliminating the
  // "Cannot read properties of null (reading 'useRef/useContext')" errors
  // that occur when multiple React instances exist simultaneously.
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
    ],
    // Force all deps that import react to share the same pre-bundled copy
    dedupe: ['react', 'react-dom'],
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Bundle analyzer - only when ANALYZE=true (run: npm run build:analyze)
    process.env.ANALYZE === 'true' && visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.ico', 'robots.txt', 'icon-*.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Astro Social - Analizler, Fallar, Kehanetler',
        short_name: 'Astro Social',
        description: 'AI destekli çoklu analiz platformu - Tarot, kahve falı, rüya tabiri, astroloji ve daha fazlası',
        theme_color: '#9b87f5',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ],
        categories: ['lifestyle', 'entertainment', 'social'],
        shortcuts: [
          {
            name: 'Tarot Falı',
            short_name: 'Tarot',
            description: 'Tarot kartları ile fal bak',
            url: '/tarot',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Kahve Falı',
            short_name: 'Kahve',
            description: 'Kahve falı yorumla',
            url: '/coffee-fortune',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        globIgnores: ['**/stats.html'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 5
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              plugins: [
                {
                  cacheWillUpdate: async ({ response }) => {
                    return response.status === 200 ? response : null;
                  }
                }
              ]
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Force a single copy of React for ALL modules (dev + build).
    // This is the canonical fix for "Cannot read properties of null (reading 'useRef/useContext')"
    // caused by react-router-dom, @radix-ui, next-themes etc. each resolving
    // their own react instance instead of sharing one.
    dedupe: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  // esbuild drop console/debugger in production
  esbuild: mode === 'production' ? {
    drop: ['console', 'debugger'],
  } : undefined,
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    // modulePreload enabled (default) — browser handles chunk dependency ordering naturally
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;

          // ─── RULE: Never split React-dependent libraries into separate chunks ───
          // react-router-dom, @radix-ui, react-hook-form, lucide-react, next-themes,
          // framer-motion, vaul, react-day-picker, @tanstack/react-query all use React
          // as a peer dep. Splitting them causes "Cannot read properties of null
          // (reading 'useRef/useContext/forwardRef')" because Rollup resolves their
          // react import to a different instance than the main bundle.
          //
          // Only truly standalone libs (no React peer dep) get their own chunk.

          // ✅ Standalone — safe to isolate
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('recharts') || id.includes('/d3-')) return 'vendor-charts';
          if (id.includes('date-fns')) return 'vendor-date';
          if (id.includes('ephemeris')) return 'vendor-astro';
          if (id.includes('zod')) return 'vendor-zod';
          if (id.includes('emoji-picker-react')) return 'vendor-emoji';

          // ❌ React-dependent — let Vite handle, return undefined
          // (react, react-dom, react-router-dom, @radix-ui, lucide-react,
          //  react-hook-form, @hookform, next-themes, vaul, react-day-picker,
          //  @tanstack/react-query, scheduler, react-is, sonner, workbox-*)
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1200,
    sourcemap: false,
    minify: 'esbuild',
  },
}));
