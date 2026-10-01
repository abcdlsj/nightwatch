import { defineConfig } from 'vitest/config';
export default defineConfig({ define: { __APP_VERSION__: '"test"' }, test: { include: ['tests/balance/**/*.balance.ts'], testTimeout: 3_600_000 } });
