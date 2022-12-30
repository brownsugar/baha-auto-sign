import { readdirSync } from 'fs'
import { resolve, parse, sep } from 'path'
import { merge } from 'webpack-merge'
import type { Configuration } from 'webpack'
import configFactory from './webpack.common'

const srcPath = resolve(__dirname, '../src')
const fetchEntries = (dir: string) => {
  const path = resolve(srcPath, dir)
  return readdirSync(path, {
    withFileTypes: true
  })
    .reduce((result, dirent) => {
      if (dirent.isFile()) {
        const file = parse(dirent.name)
        // Pre-define the output path here
        const key = dir + sep + file.name
        result[key] = resolve(path, dirent.name)
      }
      return result
    }, {})
}

export default (env: { production: boolean }, _argv): Configuration => merge(
  configFactory(env.production),
  {
    mode: env.production ? 'production' : 'development',
    entry: {
      ...fetchEntries('js'),
      ...fetchEntries('style')
    },
    devtool: false
  }
)
