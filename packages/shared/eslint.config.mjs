import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['*.mjs', '*.js'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
