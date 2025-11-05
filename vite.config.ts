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
          // CRITICAL: Keep React and React-DOM together to avoid dispatcher issues
          if (id.includes('node_modules')) {
            // React ecosystem - MUST be in same chunk
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-is') || id.includes('scheduler')) {
              return 'react-core';
            }
            // React Router
            if (id.includes('react-router')) {
              return 'react-router';
            }
            // Framer Motion (animation library)
            if (id.includes('framer-motion')) {
              return 'framer-vendor';
            }
            // Radix UI (component library) - group together
            if (id.includes('@radix-ui')) {
              return 'radix-vendor';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // React Query
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // Other vendors
            return 'vendor';
          }
          
          // Page chunks - only split large pages
          if (id.includes('src/pages/')) {
            const pageName = id.split('src/pages/')[1]?.split('.')[0];
            if (!pageName) return undefined;
            
            // Keep smaller pages in main bundle
            const smallPages = ['About', 'FAQ', 'Credits', 'NotFound', 'VapidKeyGenerator'];
            if (smallPages.some(p => pageName.includes(p))) {
              return undefined; // Include in main bundle
            }
            
            // Large pages get their own chunks
            const largePages = ['Feed', 'Messages', 'Groups', 'Match', 'Profile'];
            if (largePages.some(p => pageName.includes(p))) {
              return `page-${pageName.toLowerCase()}`;
            }
            
            // Group medium pages
            return 'pages-medium';
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
