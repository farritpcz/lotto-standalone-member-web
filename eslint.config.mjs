// ESLint config — member-web
// Rules derived from: C:/project/lotto-system/docs/coding_standards.md
// Policy: hard rules = error (alert/confirm, new any), size rules = warn
// (many existing violations; fix boy-scout-style during refactor sprints).

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  {
    rules: {
      // ─── Hard rules (error) ─────────────────────────────────────────
      "no-alert": "error",
      "@typescript-eslint/no-explicit-any": ["error", {
        ignoreRestArgs: true,
      }],
      "no-restricted-globals": ["error", "alert", "confirm", "prompt"],
      "no-console": ["error", { allow: ["warn", "error"] }],

      // ─── Size soft limits (warn) ────────────────────────────────────
      "max-lines": ["warn", {
        max: 500,
        skipBlankLines: true,
        skipComments: true,
      }],
      "max-lines-per-function": ["warn", {
        max: 100,
        skipBlankLines: true,
        skipComments: true,
        IIFEs: true,
      }],

      // ─── Quality ───────────────────────────────────────────────────
      "no-debugger": "error",
      "prefer-const": "warn",
      "eqeqeq": ["warn", "smart"],
    },
  },

  {
    files: ["**/*.config.{js,mjs,ts}", "**/next.config.*"],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
    },
  },
]);

export default eslintConfig;
