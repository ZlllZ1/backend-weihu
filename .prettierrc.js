module.exports = {
  // 超过最大值换行
  printWidth: 140,
  // 行末是否加分号
  semi: false,
  // 用单引号代替双引号
  singleQuote: true,
  // tab键宽度，默认为4
  tabWidth: 4,
  // 最后一个对象元素加逗号
  trailingComma: 'none',
  // 开启 eslint 支持
  'prettier.eslintIntegration': true,
  // 指定使用哪一种解析器
  parser: 'babel',
  // 对象，数组加空格
  bracketSpacing: true,
  // 使用tab（制表符）缩进而非空格
  useTabs: true,
  // jsx > 是否另起一行
  jsxBracketSameLine: false,
  // (x) => {} 是否要有小括号默认avoid不要，always要
  arrowParens: 'avoid',
  // 是否要注释来决定是否格式化代码
  requirePragma: false,
  // 是否要换行
  proseWrap: 'preserve',
  // 保存时自动fix
  'eslint.autoFixOnSave': true,
  // 添加 vue 支持
  'eslint.validate': [
    'javascript',
    'javascriptreact',
    {
      language: 'vue',
      autoFix: true
    }
  ]
}
