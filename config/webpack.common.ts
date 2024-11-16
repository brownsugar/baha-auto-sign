import { resolve } from 'path'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import WebpackRemoveEmptyScripts from 'webpack-remove-empty-scripts'
import TerserWebpackPlugin from 'terser-webpack-plugin'
import { SourceMapDevToolPlugin } from 'webpack'
import type { Configuration } from 'webpack'

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
