import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const packagePath = join(__dirname, '../..', 'package.json')
const installedPackage = JSON.parse(readFileSync(packagePath, 'utf8'))

export function maintainer(path: string) {
  let packageJson = JSON.parse(readFileSync(join(path, 'package.json'), 'utf8'))

  if (packageJson.devDependencies.mld !== installedPackage.version) {
    packageJson.devDependencies.mld = installedPackage.version
  }

  writeFileSync(
    join(path, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )
}
