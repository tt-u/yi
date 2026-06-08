import eslintConfigPrettier from "@electron-toolkit/eslint-config-prettier";
import tseslint from "@electron-toolkit/eslint-config-ts";
import { defineConfig } from "eslint/config";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginReactRefresh from "eslint-plugin-react-refresh";
import eslintPluginSimpleImportSort from "eslint-plugin-simple-import-sort";

export default defineConfig(
  { ignores: ["**/node_modules", "**/dist", "**/out"] },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat["jsx-runtime"],
  {
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      "simple-import-sort": eslintPluginSimpleImportSort,
    },
    rules: {
      // 简单导入排序
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",

      // 自定义规则
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": eslintPluginReactHooks,
      "react-refresh": eslintPluginReactRefresh,
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules,

      // 自定义规则
      "react-refresh/only-export-components": "off",
    },
  },
  {
    ...eslintConfigPrettier,
    rules: {
      ...eslintConfigPrettier.rules,
      "prettier/prettier": [
        "warn",
        {
          singleQuote: false,
          semi: true,
          printWidth: 80,
          tabWidth: 2,
          trailingComma: "all",
        },
      ],
    },
  },
);
