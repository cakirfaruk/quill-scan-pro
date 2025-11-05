import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Kişisel Analiz Merkezi',
        short_name: 'Analiz Merkezi',
        description: 'AI destekli çoklu analiz platformu',
        theme_color: '#9b87f5',
        background_color: '#0a0a0a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'https://storage.googleapis.com/gpt-engineer-file-uploads/DMw3eaESLpeKAzKlfQPVGMQ5a3f1/uploads/1761954894293-pngtree-black-and-white-astro-icon-in-an-orbit-vector-png-image_7075895.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        categories: ['lifestyle', 'entertainment']
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7
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
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 20,
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
  build: {
    // Manual chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Framer Motion (animation library)
            if (id.includes('framer-motion')) {
              return 'framer-vendor';
            }
            // Radix UI (component library)
            if (id.includes('@radix-ui')) {
              return 'radix-vendor';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // React Query
            if (id.includes('@tanstack')) {
              return 'query-vendor';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // Other vendors
            return 'vendor';
          }
          
          // Page chunks - group by route
          if (id.includes('src/pages/')) {
            const pageName = id.split('src/pages/')[1].split('.')[0];
            // Group smaller pages together
            const smallPages = ['About', 'FAQ', 'Credits', 'NotFound', 'VapidKeyGenerator'];
            if (smallPages.some(p => pageName.includes(p))) {
              return 'pages-misc';
            }
            // Group analysis pages
            const analysisPages = ['Tarot', 'CoffeeFortune', 'Palmistry', 'Handwriting', 'BirthChart', 'Numerology', 'DreamInterpretation', 'DailyHoroscope'];
            if (analysisPages.some(p => pageName.includes(p))) {
              return 'pages-analysis';
            }
            // Group social pages
            const socialPages = ['Feed', 'Friends', 'Messages', 'Groups', 'GroupChat', 'Reels', 'Explore', 'Discovery'];
            if (socialPages.some(p => pageName.includes(p))) {
              return 'pages-social';
            }
            // Keep large pages separate
            return `page-${pageName.toLowerCase()}`;
          }
          
          // Component chunks
          if (id.includes('src/components/')) {
            // UI components
            if (id.includes('src/components/ui/')) {
              return 'ui-components';
            }
            // Large feature components
            const largeComponents = ['VideoCallDialog', 'GroupVideoCallDialog', 'CallInterface'];
            if (largeComponents.some(c => id.includes(c))) {
              return 'components-video';
            }
            // Group smaller components
            return 'components';
          }
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Minify with terser for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
      },
    },
  },
}));
