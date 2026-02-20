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
  },
  // esbuild drop console/debugger in production
  esbuild: mode === 'production' ? {
    drop: ['console', 'debugger'],
  } : undefined,
  build: {
    // CRITICAL: Disable modulepreload — lazy chunks must NOT be eagerly preloaded
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // IMPORTANT: Check specific react-* libs BEFORE the generic react check
            // to avoid them being swallowed into react-core
            if (id.includes('react-router')) return 'react-router';
            if (id.includes('lucide-react')) return 'lucide-icons';
            if (id.includes('emoji-picker-react')) return 'emoji-picker';
            if (id.includes('react-hook-form') || id.includes('@hookform')) return 'form-vendor';
            if (id.includes('react-day-picker')) return 'date-vendor';
            if (id.includes('@tanstack/react-query')) return 'query-vendor';
            if (id.includes('recharts') || id.includes('d3-')) return 'charts-vendor';

            // CRITICAL: React core — ONLY react, react-dom, react-is, scheduler
            // Use path separators to avoid matching react-router, react-hook-form, etc.
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-is/') ||
              id.includes('/scheduler/')
            ) {
              return 'react-core';
            }

            if (id.includes('@radix-ui')) return 'radix-vendor';
            if (id.includes('@supabase')) return 'supabase-vendor';
            if (id.includes('zod')) return 'zod-vendor';
            if (id.includes('date-fns')) return 'date-vendor';
            if (id.includes('ephemeris')) return 'astronomy-vendor';
            if (id.includes('vaul')) return 'drawer-vendor';
            return 'vendor';
          }

          // Page-level code splitting
          if (id.includes('src/pages/')) {
            const pageName = id.split('src/pages/')[1]?.split('.')[0];
            if (!pageName) return undefined;

            // Small pages → main bundle
            const smallPages = ['About', 'FAQ', 'Credits', 'NotFound', 'VapidKeyGenerator'];
            if (smallPages.some(p => pageName.includes(p))) return undefined;

            // Large pages → own chunks
            const largePages = ['Feed', 'Messages', 'Groups', 'Match', 'Profile', 'GroupChat'];
            if (largePages.some(p => pageName.includes(p))) return `page-${pageName.toLowerCase()}`;

            // Category-based splitting for medium pages
            const analysisPages = ['Tarot', 'CoffeeFortune', 'Palmistry', 'BirthChart', 'Numerology', 'Compatibility', 'DailyHoroscope', 'DreamInterpretation'];
            if (analysisPages.some(p => pageName.includes(p))) return 'pages-analysis';

            const socialPages = ['Friends', 'SavedPosts', 'Reels', 'Explore', 'Discovery', 'CallHistory'];
            if (socialPages.some(p => pageName.includes(p))) return 'pages-social';

            const adminPages = ['Admin', 'ErrorMonitor', 'ErrorAnalytics', 'ErrorDetail'];
            if (adminPages.some(p => pageName.includes(p))) return 'pages-admin';

            // Remaining: Auth, Settings, GroupSettings, Install
            return 'pages-other';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    // esbuild minifier (default) — 10-20x faster than terser
    minify: 'esbuild',
  },
}));
