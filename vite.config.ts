import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Smart chunking for better caching
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // Large libraries get their own chunks
            if (id.includes('framer-motion')) return 'framer-motion';
            if (id.includes('@radix-ui')) return 'radix-ui';
            if (id.includes('react-query')) return 'react-query';
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('emoji-picker')) return 'emoji-picker';
            // Other vendors grouped together
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600, // Stricter limit
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
      },
    },
    // Optimize CSS
    cssMinify: true,
    // Report compressed size
    reportCompressedSize: true,
  },
}));
