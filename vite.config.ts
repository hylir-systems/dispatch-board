import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  // API 目标服务器地址
  const API_TARGET = env.VITE_API_TARGET || 'http://192.168.0.85:3680'

  return {
    base: '/hylir-tv-dashboard',
    plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // 浏览器兼容性配置
  esbuild: {
    target: ['es2020', 'chrome90', 'firefox88', 'safari14', 'edge90'],
    supported: {
      'top-level-await': true,
    },
  },

  css: {
    postcss: {
      plugins: [],
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],

    // 开发服务器配置
    server: {
      host: '0.0.0.0',
      port: 3000,
      cors: true, // 允许跨域
      proxy: {
        // MES 看板接口代理
        '/api/hylir-mes-center': {
          target: API_TARGET,
          changeOrigin: true,
          ws: true,
          configure: (proxy: any, _options: any) => {
            proxy.on('error', (err: NodeJS.ErrnoException, _req: any, _res: any) => {
              if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
                console.debug(`[Vite Proxy] Connection error: ${err.code}`);
                return;
              }
              console.error('[Vite Proxy] Error:', err);
            });
            proxy.on('proxyReqWs', (proxyReq: any, req: any, socket: any) => {
              socket.on('error', (err: NodeJS.ErrnoException) => {
                if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
                  console.debug(`[Vite Proxy] WebSocket error: ${err.code}`);
                  return;
                }
                console.error('[Vite Proxy] WebSocket error:', err);
              });
            });
          },
        },

        // 主数据接口代理
        '/api/hylir-masterdata-center': {
          target: API_TARGET,
          changeOrigin: true,
          ws: true,
          configure: (proxy: any, _options: any) => {
            proxy.on('error', (err: NodeJS.ErrnoException, _req: any, _res: any) => {
              if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
                console.debug(`[Vite Proxy] Connection error: ${err.code}`);
                return;
              }
              console.error('[Vite Proxy] Error:', err);
            });
          },
        },
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: '[ext]/[name]-[hash].[ext]',
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@fortawesome/fontawesome-svg-core', '@fortawesome/free-solid-svg-icons', '@fortawesome/free-regular-svg-icons', '@fortawesome/react-fontawesome'],
          },
        },
      },
    },

    // Preview 服务器配置
    preview: {
      host: '0.0.0.0',
      port: 4173,
    },
  }
})
