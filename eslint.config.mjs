// import { dirname } from "path";
// import { fileURLToPath } from "url";
// import { FlatCompat } from "@eslint/eslintrc";

// // Get the current file and directory names
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // Initialize FlatCompat with the base directory
// const compat = new FlatCompat({
//   baseDirectory: __dirname,
// });

// // Define the ESLint configuration
// const eslintConfig = {
//   extends: [
//     ...compat.extends("next/core-web-vitals", "next/typescript"),
//   ],
//   rules: {
//     "@typescript-eslint/no-require-imports": "off", // Correct rule definition
//   },
// };

// export default eslintConfig;

/* eslint-disable import/no-anonymous-default-export */

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const extendedConfigs = compat.extends("next/core-web-vitals", "next/typescript");

const config = [
  ...extendedConfigs,
  {
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default config;
