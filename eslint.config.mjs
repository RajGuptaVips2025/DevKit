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

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

// Flatten the extended configs into an array
const extendedConfigs = compat.extends("next/core-web-vitals", "next/typescript");

// Export an array of configs, combining extended and custom
export default [
  ...extendedConfigs,
  {
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",  // <--- added this line
      // add any other custom rules here
    },
  },
];
