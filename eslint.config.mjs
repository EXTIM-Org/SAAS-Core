import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js', '*.mjs', '*.cjs', 'apps/*/*.mjs', 'apps/*/*.js', 'apps/*/.next/types/*.ts'],
          defaultProject: 'tsconfig.eslint.json',
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  }
);
