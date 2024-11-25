module.exports = {
	printWidth: 100,
	semi: false,
	singleQuote: true,
	tabWidth: 2,
	trailingComma: 'none',
	'prettier.eslintIntegration': true,
	parser: 'babel',
	bracketSpacing: true,
	useTabs: true,
	jsxBracketSameLine: false,
	arrowParens: 'avoid',
	requirePragma: false,
	proseWrap: 'preserve',
	'eslint.autoFixOnSave': true,
	'eslint.validate': [
		'javascript',
		'javascriptreact',
		{
			language: 'vue',
			autoFix: true
		}
	]
}
