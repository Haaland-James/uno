import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Unit-test config for the pure `src/lib` layer.
 *
 * Deliberately minimal: everything under test is a pure function with no DOM,
 * no network and no Prisma, so there is no jsdom environment, no React plugin
 * and no setup file. If we later test components or route handlers, add a
 * second `projects` entry rather than widening this one — keeping the pure
 * suite dependency-free is what keeps it fast enough to run on every save.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/**/*.test.ts"],
    },
  },
  resolve: {
    alias: {
      // Mirrors the `@/*` path in tsconfig.json. Done by hand so the suite does
      // not depend on vite-tsconfig-paths for a single mapping.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
