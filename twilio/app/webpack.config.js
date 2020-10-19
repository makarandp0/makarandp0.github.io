const path = require('path');

module.exports = {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  entry: {
    foo: './src/tokens.js',
    app: './src/app.js',
    admin: './src/admin.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './dist'),
  },
  devtool: 'inline-source-map',
  devServer: {
    https: false,
    contentBase: './dist',
    proxy: {
      '/token': 'http://localhost:3000',
      '/settings': 'http://localhost:9000'
    }
  }
};
