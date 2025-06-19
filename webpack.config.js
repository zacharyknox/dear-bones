const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const commonConfig = {
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
};

const mainConfig = {
  ...commonConfig,
  entry: './src/main/index.ts',
  target: 'electron-main',
  externals: {
    'sqlite3': 'commonjs sqlite3',
  },
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'index.js',
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};

const preloadConfig = {
  ...commonConfig,
  entry: './src/main/preload.ts',
  target: 'electron-preload',
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'preload.js',
  },
};

const rendererConfig = {
  ...commonConfig,
  entry: './src/renderer/index.tsx',
  target: 'electron-renderer',
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: 'renderer.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
    }),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'dist/renderer'),
    compress: true,
    port: 9000,
  },
};

module.exports = [mainConfig, preloadConfig, rendererConfig]; 