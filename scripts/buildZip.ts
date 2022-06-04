import { readFileSync, writeFileSync, existsSync } from 'fs'
import * as Zip from 'adm-zip'
import { PackageJson } from 'type-fest'

const packageJsonPath = './package.json'
const packageJson: PackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
const version = packageJson.version
if (version === undefined) {
  console.error('Could not fetch package version.')
  process.exit(1)
}

const manifestPath = './dist/manifest.json'
if (!existsSync(manifestPath)) {
  console.error('Could not find manifest file, please run `yarn build` first.')
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
manifest.version = version
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

const zip = new Zip()
zip.addLocalFolder('./dist', '')
const zipName = `${packageJson.name as string}-v${version}`
zip.writeZip(`./build/${zipName}.zip`)
