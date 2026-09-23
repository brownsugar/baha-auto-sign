import { resolve } from 'path'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import WebpackRemoveEmptyScripts from 'webpack-remove-empty-scripts'
import TerserWebpackPlugin from 'terser-webpack-plugin'
import { SourceMapDevToolPlugin } from 'webpack'
import type { Configuration } from 'webpack'
import packageJson from '../package.json'

const distPath = resolve(__dirname, '../dist')
export default (production: boolean) => {
  const config: Configuration = {
    output: {
      path: distPath,
      filename: '[name].js',
      clean: true,
    },
    stats: {
      all: false,
      errors: true,
      builtAt: true,
      assets: true,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'sass-loader',
          ],
        },
      ],
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: '**/*',
            to: distPath,
            context: 'public',
            globOptions: {
              ignore: ['**/manifest.json', '**/options.css'],
            },
          },
          {
            // 唯一版本來源：package.json。拷貝 manifest 時即注入，
            // dev／build:ext 產出的 dist 載入測試也是正確版號；
            // build:zip 仍會寫入相同值，原發布流程不變。
            from: 'manifest.json',
            to: distPath,
            context: 'public',
            transform(content) {
              const manifest = JSON.parse(content.toString())
              manifest.version = packageJson.version.split('-')[0] // Handle pre-released versions, e.g. 1.0.0-rc.0
              return JSON.stringify(manifest, null, 2)
            },
          },
        ],
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      // Remove empty js file generated along with scss files.
      new WebpackRemoveEmptyScripts({}),
    ],
    resolve: {
      extensions: ['.ts', '.js', '.scss', '.css'],
      fallback: {
        https: false,
      },
    },
  }

  if (production) {
    config.optimization = {
      minimize: true,
      minimizer: [new TerserWebpackPlugin()],
    }
  } else {
    config.plugins?.push(
      new SourceMapDevToolPlugin({
        filename: '[file].map',
        // Set the public path to parent due to pre-defined path in entry points.
        publicPath: '../',
      }),
    )
  }

  return config
}
