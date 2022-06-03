import { resolve } from 'path'
import * as MiniCssExtractPlugin from 'mini-css-extract-plugin'
import * as CopyWebpackPlugin from 'copy-webpack-plugin'
import * as WebpackRemoveEmptyScripts from 'webpack-remove-empty-scripts'
import { SourceMapDevToolPlugin } from 'webpack'
import type { Configuration } from 'webpack'

const distPath = resolve(__dirname, '../dist')
export default (production: boolean) => {
  const config: Configuration = {
    output: {
      path: distPath,
      filename: '[name].js',
      clean: true
    },
    stats: {
      all: false,
      errors: true,
      builtAt: true,
      assets: true
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'sass-loader'
          ]
        }
      ]
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: '**/*',
            to: distPath,
            context: 'public'
          }
        ]
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css'
      }),
      // Remove empty js file generated along with scss files.
      new WebpackRemoveEmptyScripts()
    ],
    resolve: {
      extensions: ['.ts', '.js', '.scss', '.css']
    }
  }

  if (!production) {
    config.plugins?.push(
      new SourceMapDevToolPlugin({
        filename: '[file].map',
        // Set the public path to parent due to pre-defined path in entry points.
        publicPath: '../'
      })
    )
  }

  return config
}
