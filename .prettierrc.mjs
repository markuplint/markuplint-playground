import config from '@markuplint-dev/prettier-config';

export default {
	...config,
	plugins: ['prettier-plugin-tailwindcss'],
	overrides: [
		{
			files: ['./src/examples/files/**'],
			options: {
				tabWidth: 2,
				useTabs: false,
			},
		},
	],
};
