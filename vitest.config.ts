import { defaultClientConditions, defaultServerConditions } from "vite"
import { defineConfig } from "vitest/config"

const CONTAINER_STARTUP_TIMEOUT_MS = 120_000
const INTEGRATION_TEST_TIMEOUT_MS = 15_000

export default defineConfig({
  resolve: {
    conditions: ["source", ...defaultClientConditions],
  },
  ssr: {
    resolve: {
      conditions: ["source", ...defaultServerConditions],
    },
  },
  test: {
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      include: ["packages/contract/src/**", "apps/api/src/**", "apps/web/src/**"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/test/**",
        "**/index.ts",
        "apps/api/src/server.ts",
        "apps/api/src/db/migrate.ts",
        "apps/api/src/db/migrations/**",
        "apps/web/src/main.tsx",
        "apps/web/src/components/ui/icons.ts",
        "packages/contract/src/optionLists.ts",
        "packages/contract/src/examples.ts",
      ],
      thresholds: {
        "packages/contract/src/**": { lines: 100, branches: 100 },
        "apps/api/src/{modules,errors,config}/**": { lines: 95, branches: 90 },
        "apps/web/src/{features,shell,api}/**": { lines: 90, branches: 85 },
        "apps/web/src/{pages,components}/**": { lines: 85, branches: 80 },
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit:contract",
          include: ["packages/contract/src/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "unit:api",
          include: ["apps/api/src/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "unit:web",
          include: ["apps/web/src/**/*.test.ts"],
          environment: "jsdom",
        },
      },
      {
        extends: true,
        test: {
          name: "component:web",
          include: ["apps/web/src/**/*.test.tsx"],
          environment: "jsdom",
        },
      },
      {
        extends: true,
        test: {
          name: "integration:api",
          include: ["apps/api/test/integration/**/*.test.ts"],
          environment: "node",
          fileParallelism: false,
          hookTimeout: CONTAINER_STARTUP_TIMEOUT_MS,
          testTimeout: INTEGRATION_TEST_TIMEOUT_MS,
        },
      },
    ],
  },
})
