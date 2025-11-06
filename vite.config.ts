import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    mode === "development" && visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Simplified chunking - let Vite handle React automatically
        manualChunks: (id) => {
          // Only split very heavy libraries
          if (id.includes('fabric')) {
            return 'fabric';
          }
          
          if (id.includes('recharts')) {
            return 'recharts';
          }
          
          if (id.includes('emoji-picker-react')) {
            return 'emoji-picker';
          }
          
          // Let Vite handle everything else including React
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: true,
    target: 'es2020',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      '@supabase/supabase-js',
      '@supabase/postgrest-js'
    ],
  },
}));
