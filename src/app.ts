// Module imports
import { Command } from 'commander'
import { readFileSync } from 'fs'
import fetch from 'node-fetch'
import { join } from 'path'

// Local imports
import { build, deploy, dev, init } from './commands'
import { currentOrPath } from './utils'

fetch('https://raw.githubusercontent.com/fushra/mld/main/package.json')
  .then()
  .then(async (res) => {
    const json = await res.json()

    const packagePath = join(__dirname, '..', 'package.json')
    const packageContents = JSON.parse(readFileSync(packagePath).toString())

    if (json.version != packageContents.version) {
      console.log('A new version of mld is available, please upgrade')
    }
  })
  .catch(() => {
    // Errors here do not matter
  })

// Create a commander context for this program
const program = new Command()

// Set a bunch of basic stuff from the package.json
program.version('1.0.0-a.3').description('The MEML tooling system')

// The initialization command for initializing a directory
program
  .command('init [directory]')
  .description('Create a MEML project in the current or specified directory')
  .action((directory) => init(currentOrPath(directory)))

// The command for starting development in a directory
program
  .command('dev [directory]')
  .description('Start a dev server in the current or specified directory')
  .action((directory) => dev(currentOrPath(directory)))

// The command for compiling into an optimized source bundle
program
  .command('build [directory]')
  .description('Build an optimized bundle for the current directory')
  .action((directory) => build(currentOrPath(directory)))

// An interactive prompt to prepare your project for deployment on one of our supported platforms
program
  .command('deploy [directory]')
  .description(
    'An interactive prompt to prepare your project for deployment on one of our supported platforms'
  )
  .action((directory) => deploy(currentOrPath(directory)))

// Parse the CLI arguments
program.parse(process.argv)
