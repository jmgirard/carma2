// webpack.renderer.config.js
const path = require('path');

module.exports = {
  // 1) Entry point: your renderer.js
  entry: './src/renderer.js',

  // 2) Output: bundled file
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'renderer.bundle.js',
  },

  // 3) Tell Webpack this is for Electron’s renderer process
  target: 'electron-renderer',

  // 4) Mode: switch to "production" for minification
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

  // 5) Module rules for loaders
  module: {
    rules: [
      {
        test: /\.m?js$/,              // .js or .mjs
        exclude: /node_modules/,
        use: 'babel-loader',          // transpile via Babel
      },
      {
        test: /\.css$/,               // (optional) CSS imports
        use: ['style-loader', 'css-loader'],
      },
      // add other loaders here (e.g. file-loader for images/fonts)
    ],
  },

  // 6) (Optional) Source maps in dev
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',

  // 7) (Optional) Resolve aliases or extensions
  resolve: {
    extensions: ['.js', '.json'],
  },
};
