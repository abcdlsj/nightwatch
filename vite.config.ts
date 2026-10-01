import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

export default defineConfig({
  /* 相对路径：网页、Capacitor 原生壳、以后的桌面壳都能直接用同一份构建产物 */
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: {
    outDir: 'dist',
    target: 'es2020',
    assetsInlineLimit: 0,
    /* 不压缩 CSS：lightningcss 会把 backdrop-filter 合并成只剩 -webkit- 前缀，Chrome 上模糊失效。
     * 样式源文件本来就是紧凑写法，gzip 后差别很小 */
    cssMinify: false,
  },
  server: { host: true },
});
