module.exports = {
	root: true,
	env: {
		browser: true,
		node: true,
		es6: true
	},
	extends: ['plugin:vue/recommended', 'eslint:recommended'],
	parserOptions: {
		parser: 'babel-eslint',
		sourceType: 'module'
	},
	rules: {
		'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
		indent: ['off', 2],
		'no-irregular-whitespace': 'off',
		'vue/script-indent': ['error', 4, { baseIndent: 1 }],
		'space-before-function-paren': [0, 'always'],
		'spaced-comment': 0,
		'comma-dangle': [1, 'never'],
		'no-mixed-spaces-and-tabs': [1, 'smart-tabs'],
		'no-tabs': 0,
		'linebreak-style': ['off', 'windows'],
		quotes: ['error', 'single'],
		semi: ['error', 'never']
	}
}
