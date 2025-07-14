import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
	// 1. デフォルト設定
	js.configs.recommended,
	...tseslint.configs.recommended,

	// 2. Svelte ファイル用の設定
	...svelte.configs['flat/recommended'],

	// 3. Prettier との競合ルールを無効化 (必ず最後に配置)
	prettier,

	// 4. グローバルな設定
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},

	// 5. TypeScript と Svelte 内の TypeScript を含むファイルの設定
	{
		files: ['**/*.ts', '**/*.svelte'],
		languageOptions: {
			parserOptions: {
				project: './tsconfig.json',
				extraFileExtensions: ['.svelte', '*.svelte.ts']
			}
		},
		rules: {
			// プロジェクト固有のルールをここに追加
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					ignoreRestSiblings: true,
					argsIgnorePattern: '^_+',
					varsIgnorePattern: '^_+'
				}
			]
		}
	},

	// 6. Svelte ファイル固有の設定
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelte.parser,
			parserOptions: {
				parser: tseslint.parser
			}
		},
		rules: {
			// Svelte 固有のルール
		}
	},

	// 7. 無視するファイルやディレクトリ
	{
		ignores: [
			'.svelte-kit/',
			'.vercel/',
			'build/',
			'dist/',
			'node_modules/',
			'package/',
			'nonnon/',
			'vitest-setup-client.ts',
			'.DS_Store'
		]
	}
];
