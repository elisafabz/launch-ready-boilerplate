import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", ".next"]),

  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      // alt text, valid anchors (no href="#"), heading content, label/control pairs
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // No leftover console.log in shipped code. warn/error stay for real diagnostics.
      "no-console": ["error", { allow: ["warn", "error"] }],
      // Radix comes from the `radix-ui` umbrella only. Subpath packages resolve
      // today via hoisting, break under pnpm/Yarn PnP, and a second copy of
      // e.g. react-dismissable-layer makes nested overlays misbehave.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@radix-ui/react-*"],
              message: 'Import from "radix-ui" instead (e.g. import { Dialog as DialogPrimitive } from "radix-ui").',
            },
          ],
        },
      ],
    },
  },

  // shadcn/ui components often export variants/helpers alongside components
  // which triggers react-refresh/only-export-components.
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
      // Upstream shadcn wrappers (CardTitle, AlertTitle, PaginationLink) receive
      // their content via children at the call site, which the static rule cannot see.
      "jsx-a11y/heading-has-content": "off",
      "jsx-a11y/anchor-has-content": "off",
    },
  },

  // recharts v2 does not type its tooltip/legend payloads, so the upstream shadcn
  // chart wrapper has to fall back to `any`. Scoped to this one file on purpose —
  // do not widen to the whole ui folder.
  {
    files: ["src/components/ui/chart.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Test files don't export React components
  {
    files: ["tests/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
]);