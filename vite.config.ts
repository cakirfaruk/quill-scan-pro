import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Bundle analyzer - run 'npm run build' to see stats.html
    mode === 'production' && visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    // Gzip and Brotli compression
    mode === 'production' && viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files larger than 1KB
      deleteOriginFile: false,
    }),
    mode === 'production' && viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false,
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
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // NOTE: React and React-DOM must NOT be split into custom chunks.
            // Vite handles React deduplication automatically via its module graph.
            // Splitting React causes "Cannot read properties of null (reading 'useState')" errors.
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-is/') ||
              id.includes('/scheduler/') ||
              id.includes('/react-router') ||
              id.includes('/framer-motion') ||
              id.includes('/@radix-ui')
            ) {
              // Let Vite/Rollup handle these naturally - do not split
              return undefined;
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // React Query
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            // Recharts - heavy charting library, isolate it
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'recharts-vendor';
            }
            // Emoji picker - heavy, isolate it
            if (id.includes('emoji-picker-react')) {
              return 'emoji-vendor';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // Other vendors
            return 'vendor';
          }

          // Page chunks - only split pages, not shared components
          if (id.includes('src/pages/')) {
            const pageName = id.split('src/pages/')[1]?.split('.')[0];
            if (!pageName) return undefined;

            // Keep smaller pages in main bundle
            const smallPages = ['About', 'FAQ', 'Credits', 'NotFound', 'VapidKeyGenerator'];
            if (smallPages.some(p => pageName.includes(p))) {
              return undefined;
            }

            // Large pages get their own chunks
            const largePages = ['Feed', 'Messages', 'Groups', 'GroupChat', 'Match', 'Profile', 'Admin', 'ErrorMonitor', 'ErrorAnalytics', 'Reels', 'Tarot', 'BirthChart', 'Numerology', 'Palmistry', 'CoffeeFortune', 'Compatibility', 'DreamInterpretation', 'DailyHoroscope'];
            if (largePages.some(p => pageName.includes(p))) {
              return `page-${pageName.toLowerCase()}`;
            }

            return 'pages-medium';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },
  },
}));
