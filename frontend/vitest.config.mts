import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

/**
 * Two projects keep the suite fast: pure logic (`*.test.ts`) runs in plain Node, and only component
 * tests (`*.test.tsx`) pay for a jsdom environment.
 */
export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          setupFiles: ["./src/test/setup.node.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./src/test/setup.ts"],
          css: false,
          // Cold jsdom + Radix imports can exceed 5s on a saturated CI runner; logic tests keep the default.
          testTimeout: 15_000,
        },
      },
    ],
  },
});
