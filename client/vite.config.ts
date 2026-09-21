import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })),
  },
  server: {
    port: 5174,
    host: true,
  }
});
