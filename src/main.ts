/* 入口：先让平台层就绪（原生壳里要先把存档从原生存储读进内存），再加载游戏本体 */
import './styles/index.css';
import { initPlatform } from './platform/native';

initPlatform()
  .catch((e) => console.error('平台初始化失败，退回网页存储', e))
  .then(() => import('./app/boot'));
