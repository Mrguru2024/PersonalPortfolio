import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "dist/**",
      "coverage/**",
      "public/**",
      "api/**",
      "app/admin/newsletters/*/page.tsx",
      "scripts/**",
      "server/**",
      "types/**",
      "**/*.d.ts",
    ],
  },
];
