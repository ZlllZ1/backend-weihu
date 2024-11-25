module.exports = {
	root: true,
	env: {
		browser: true,
		node: true,
		es6: true
	},
	// extends: ['plugin:vue/essential', '@vue/standard'],
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
		// 强制在注释中 // 或 /* 使用一致的空格
		'spaced-comment': 0,
		// always-multiline：多行模式必须带逗号，单行模式不能带逗号
		'comma-dangle': [1, 'never'],
		// 末尾禁止使用分号
		'no-mixed-spaces-and-tabs': [1, 'smart-tabs'],
		// semi: 0,
		'no-tabs': 0,
		'linebreak-style': ['off', 'windows'],
		quotes: ['error', 'single'],
		semi: ['error', 'never']
	}
}
