import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

export default defineConfig({
  /* 相对路径：网页、Capacitor 原生壳、以后的桌面壳都能直接用同一份构建产物 */
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_ID__: JSON.stringify(pkg.version + '-' + Date.now().toString(36)),
    /* Vercel 构建时自带 VERCEL=1：独立站按系统语言选中英文；B站 Toy 包和原生壳在本地构建，照旧默认中文
     * Vercel builds set VERCEL=1: the standalone site picks Chinese or English from the system language; Toy and native builds are made locally and keep Chinese as the default */
    __AUTO_LANG__: JSON.stringify(process.env.VERCEL === '1' || process.env.AUTO_LANG === '1'),
  },
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
