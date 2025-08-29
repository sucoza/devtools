module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  rules: {
    "no-unused-vars": "off", // Let TypeScript handle this
    "@typescript-eslint/no-unused-vars": "warn",
    "no-console": "warn",
    "no-case-declarations": "off", // Allow let/const in switch cases
    "no-undef": "off", // Let TypeScript handle undefined variables
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  ignorePatterns: ["dist", "node_modules", "rollup.config.js", ".eslintrc.cjs"],
};