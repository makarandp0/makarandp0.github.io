const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'inline-source-map',
  devServer: {
    https: false,
    contentBase: './dist',
    proxy: {
      '/token': 'http://localhost:3000'
    }
  }
};
