const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const mode = process.env.Node_ENV.trim();

var config = {
  mode: mode,
  devtool: 'inline-cheap-source-map',
  entry: {
    app: './main.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    // new webpack.ProgressPlugin((percentage, ...args) => {
    //   console.info(parseInt(percentage * 100), '%', ...args);
    // }),
    new CleanWebpackPlugin(['dist']),
    new CopyWebpackPlugin([{
      from: {
        glob: path.resolve(__dirname, 'dll/**/*'),
        dot: true
      },
      to: path.resolve(__dirname, 'dist')
    }]),
    new HtmlWebpackPlugin({
      template: './index.html',
      minify: true
    }),
    new HtmlWebpackIncludeAssetsPlugin({
      assets: [{
        path: 'dll',
        glob: '*.js',
        globPath: path.resolve(__dirname, 'dll')
      }],
      append: false
    }),
    new webpack.DllReferencePlugin({
      context: __dirname,
      manifest: require("./dll/manifest.json")
    }),
    new webpack.ProvidePlugin({
      _: 'lodash' // 全局配置lodash
    })
  ],
  module: {
    rules: [{
      test: /\.(png|jpg|jpeg|gif)$/,
      use: [{
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'images/'
        }
      }]
    }, {
      test: /\.css$/,
      use: [
        "style-loader", {
          loader: 'css-loader',
          options: {
            importLoaders: 1,
            modules: false,
          }
        },
        'postcss-loader'
      ]
    }, {
      test: /(\.js|\.jsx)$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env', '@babel/preset-react'
          ],
          plugins: [
            '@babel/transform-runtime',
            [
              "@babel/plugin-proposal-decorators", {
                "legacy": true
              }
            ],
            [
              "@babel/plugin-proposal-class-properties", {
                "loose": true
              }
            ]
          ]
        }
      }
    }]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      minChunks: 1,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10
        },
        default: {
          minChunks: 1,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  },
  performance: {
    hints: false
  }
}

if (mode == 'development') {
  config.devServer = {
    contentBase: './dist',
    inline: true,
    compress: true,
    disableHostCheck: true,
    host: '0.0.0.0',
    useLocalIp: true,
    open: false, // 自动打开浏览器页面
    proxy: { // 配置代理
      // '/api': 'http://localhost:3000'
    },
    port: 8080
    // clientLogLevel: 'info', watchContentBase: true
  }
}

module.exports = config;
