module.exports = {
  root: true,
  env: {
      node: true,
      es2021: true
  },
  extends: 'eslint:recommended',
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
  }
}