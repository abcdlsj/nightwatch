import type { CapacitorConfig } from '@capacitor/cli';

/* 原生壳（iOS / Android）。网页构建产物 dist/ 原样装进去：
 *   npm run build && npx cap sync      同步到 ios/ 和 android/
 *   npx cap open ios / npx cap open android   用 Xcode / Android Studio 打开
 * appId 上架前定下来就不能再改（App Store / Google Play 都按它认应用） */
const config: CapacitorConfig = {
  appId: 'com.abcdlsj.nightwatch',
  appName: 'Night Watch',
  webDir: 'dist',
  backgroundColor: '#0f1c20',
  ios: {
    contentInset: 'never',
    /* 游戏自己处理刘海和圆角（CSS 的 safe-area-inset） */
    scrollEnabled: false,
  },
  android: {
    backgroundColor: '#0f1c20',
  },
};

export default config;
