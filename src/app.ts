// Module imports
import { Command } from 'commander'

// Local imports
import packageConfig from '../package.json'
import { init } from './commands'
import { currentOrPath } from './utils'

// Create a commander context for this program
const program = new Command()

// Set a bunch of basic stuff from the package.json
program.version(packageConfig.version).description(packageConfig.description)

// The initialization command for initializing a directory
// TODO: Functionality
program
  .command('init [directory]')
  .description('Create a MEML project in the current or specified directory')
  .action((directory) => init(currentOrPath(directory)))

// The command for starting development in a directory
// TODO: Implement
program
  .command('dev [directory]')
  .description('Start a dev server in the current or specified directory')
  .action(() => console.log('TODO'))

// The command for compiling into an optimized source bundle
// TODO: Implement
program
  .command('build [directory]')
  .option('-o, --out', 'a custom output directory')
  .description('Build an optimized bundle for the current directory')
  .action(() => console.log('TODO'))

// Parse the CLI arguments
program.parse(process.argv)
