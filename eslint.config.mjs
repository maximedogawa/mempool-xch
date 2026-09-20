import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";

export default [
  {
    ignores: [
      "**/.next/**",
      "**/out/**",
      "**/sage-snapshot/**",
      "**/node_modules/**",
      "**/*.d.ts",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/*.config.{js,mjs,cjs}",
      "**/next.config.*",
      "**/postcss.config.*",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // The embeds are plain browser scripts served as-is from public/ (no bundler, no TypeScript).
    files: ["public/embed/**/*.js"],
    languageOptions: { sourceType: "script", globals: globals.browser },
    rules: { "no-var": "off" },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks, "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "no-console": "error",
      "no-debugger": "error",
      "no-var": "error",
      "prefer-const": "error",
      "prefer-template": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // next/image re-serves remote files from our own origin (/_next/image), which would make
      // this site the host of third-party NFT artwork it has no rights to and no control over.
      // Asset imagery is always a plain <img>/<video> pointing straight at the source.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/image",
              message:
                "next/image proxies and caches remote files on our origin. NFT and token imagery must load directly from its source: use src/shared/ui/AssetImage.tsx.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["scripts/**/*.ts", "tests/**/*.ts", "src/server/**/*.ts"],
    rules: { "no-console": "off" },
  },
];
