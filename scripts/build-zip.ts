import { readFileSync, writeFileSync, existsSync } from 'fs'
import Zip from 'adm-zip'
import packageJson from '../package.json'

const version = packageJson.version
if (version === undefined) {
  console.error('Could not fetch package version.')
  process.exit(1)
}

const manifestPath = './dist/manifest.json'
if (!existsSync(manifestPath)) {
  console.error('Could not find manifest file, please run `yarn build:ext` first.')
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
manifest.version = version.split('-')[0] // Handle pre-released versions, e.g. 1.0.0-rc.0
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

const zip = new Zip()
zip.addLocalFolder('./dist', '')
const zipName = `${packageJson.name as string}-v${version}.zip`
zip.writeZip(`./build/${zipName}`)

console.log('Successfully built extension package file:', zipName)
