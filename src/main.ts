/* 入口：先让平台层就绪（原生壳里要先把存档从原生存储读进内存），再加载游戏本体 / Entry: get the platform layer ready first (on native, load the save from native storage into memory), then load the game itself */
import './styles/index.css';
import { initPlatform } from './platform/native';
import { registerSW, standalone } from './platform/pwa';

/* 测试用：?safe=62,34 模拟刘海和底部横条的安全区（浏览器里没有 env(safe-area-inset-*)） / for testing: ?safe=62,34 fakes the notch and home-bar safe area (browsers lack env(safe-area-inset-*)) */
const safe = new URLSearchParams(location.search).get('safe');
if (safe) {
  const [t, b] = safe.split(',').map((v) => (+v || 0) + 'px');
  document.documentElement.style.setProperty('--sat', t);
  document.documentElement.style.setProperty('--sab', b || '0px');
}

/* 从主屏打开时没有浏览器栏，样式里据此微调；网页版注册离线缓存 / launched from the home screen there is no browser chrome, so styles tweak accordingly; the web build registers the offline cache */
if (standalone()) document.documentElement.classList.add('standalone');
registerSW(__BUILD_ID__);

initPlatform()
  .catch((e) => console.error('平台初始化失败，退回网页存储', e))
  .then(() => import('./app/boot'));
