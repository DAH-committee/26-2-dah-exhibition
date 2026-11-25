import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 확인용 서버에서는 NO_HMR=1 로 띄워 모듈을 매번 새로 읽는다
  server: { hmr: process.env.NO_HMR ? false : undefined },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'react-router-dom', 'three', 'gsap', 'lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        // 3D 엔진은 따로 묶어 화면 코드와 캐시를 나눈다
        manualChunks: { three: ['three'], vendor: ['react', 'react-dom', 'react-router-dom', 'gsap'] },
      },
    },
    chunkSizeWarningLimit: 700,
  },
})
