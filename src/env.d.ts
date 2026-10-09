/** 构建时注入的版本号（package.json 的 version） / version injected at build time (package.json version) */
declare const __APP_VERSION__: string;
/** 每次构建不同（离线缓存按它换版本） / different every build (the offline cache uses it to version itself) */
declare const __BUILD_ID__: string;

interface ImportMetaEnv {
  /** 接口地址（Cloudflare Worker），比如 https://nightwatch-api.xxx.workers.dev；不填就不发统计、不开排行榜 / API base (Cloudflare Worker), e.g. https://nightwatch-api.xxx.workers.dev; leave empty to send no stats and disable the leaderboard */
  readonly VITE_API_BASE?: string;
}
