// webpack.main.config.js
const path = require('path');

module.exports = {
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'main.bundle.js',
  },
  target: 'electron-main',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  // you may need babel-loader if you use modern JS
};
