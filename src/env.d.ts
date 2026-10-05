/** 构建时注入的版本号（package.json 的 version） / version injected at build time (package.json version) */
declare const __APP_VERSION__: string;
/** 每次构建不同（离线缓存按它换版本） / different every build (the offline cache uses it to version itself) */
declare const __BUILD_ID__: string;
