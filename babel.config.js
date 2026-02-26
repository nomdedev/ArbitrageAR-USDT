/**
 * Babel config para Jest
 * Permite importar módulos ES6 (export/import) desde los tests
 */
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' },
        modules: 'commonjs'
      }
    ]
  ]
};
