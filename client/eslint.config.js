export default [
  {
    files: ["src/**/*.jsx", "src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: { "no-unused-vars": "off" },
  },
];
