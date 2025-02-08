import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import vitestPlugin from '@vitest/eslint-plugin';
import globals from 'globals';
import { config } from '@markuplint-dev/eslint-config';

/** @type {import('eslint').Linter.Config[]}  */
export default [
	...config,
	reactPlugin.configs.flat.recommended,
	testingLibraryPlugin.configs['flat/react'],
	{
		// global settings
		plugins: {
			'react-hooks': reactHooksPlugin,
			'react-refresh': reactRefresh,
			vitest: vitestPlugin,
		},
		languageOptions: {
			globals: { ...globals.browser, React: true, JSX: true },
			parserOptions: {
				ecmaFeatures: { jsx: true },
			},
		},
		settings: { react: { version: 'detect' }, 'import/resolver': { typescript: [] } },
	},
	{
		// TypeScript
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parserOptions: {
				// https://typescript-eslint.io/getting-started/typed-linting/
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'@typescript-eslint/no-unused-vars': [2, { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
			'@typescript-eslint/prefer-readonly-parameter-types': [
				1,
				{
					allow: [
						{ from: 'lib', name: 'URL' },
						{ from: 'package', package: 'json-schema', name: 'JSONSchema7' },
						{ from: 'package', package: 'json-schema', name: 'JSONSchema7Definition' },
					],
					checkParameterProperties: false,
					ignoreInferredTypes: true,
				},
			],
		},
	},
	{
		files: ['./*.js'],
		rules: {
			'@typescript-eslint/no-var-requires': 0,
		},
	},
	{
		files: ['./*.mjs'],
		rules: {
			'import/no-named-as-default-member': 0,
		},
	},
	{
		// React
		files: ['**/*.tsx'],
		rules: {
			// https://github.com/facebook/react/issues/28313
			...reactHooksPlugin.configs.recommended.rules,
			'react/display-name': 0,
			'react/prop-types': 0,
			'react-refresh/only-export-components': 'warn',
			'unicorn/filename-case': 0,
		},
	},
	{
		files: ['**/*.spec.ts', '**/*.spec.tsx'],
		rules: {
			'testing-library/prefer-user-event': 2,
			'testing-library/no-manual-cleanup': 0,
		},
	},
	{
		files: ['vitest.config.ts'],
		rules: {
			'import/no-default-export': 0,
		},
	},
];
