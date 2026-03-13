import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["scripts/**", "backups/**", "client/**"],
  },
];

export default eslintConfig;
