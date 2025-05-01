import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { Connect } from 'vite' // Import Connect type for middleware
import { app as expressApp } from './src/server' // Import our Express app
import type { Server } from 'http';
import type { ViteDevServer } from 'vite';

// Function to attach Express app as middleware
const expressMiddleware = () => {
  return {
    name: 'express-middleware',
    configureServer(server: ViteDevServer) {
      // Attach your express app
      server.middlewares.use(expressApp as Connect.HandleFunction);
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    expressMiddleware() // Add the Express middleware plugin
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173, // Your frontend port
    // Remove the proxy, Vite will handle /api routes via the middleware now
    // proxy: { ... } 
    allowedHosts: [
      // Allow the ngrok host
      'ec83-2600-1005-b246-535e-b4b9-ad88-9f29-ff3c.ngrok-free.app',
      // Keep localhost/default hosts if needed
      '.localhost',
      'localhost'
    ],
    // If you need HMR through ngrok (can sometimes be tricky)
    // hmr: {
    //   protocol: 'wss',
    //   host: 'ec83-2600-1005-b246-535e-b4b9-ad88-9f29-ff3c.ngrok-free.app',
    //   clientPort: 443 // Use standard HTTPS port for WSS
    // }
  }
})