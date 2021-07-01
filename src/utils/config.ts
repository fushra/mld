import { readFileSync } from 'fs'
import { MemlCore } from 'meml'
import { join } from 'path'

export const defaultConfig: Config = {
  pages: [],
  srcDir: 'src',
  out: 'build',
  publicDir: 'public',
  codeSplitting: true,
  root: '/',
  devServer: {
    port: 8080,
  },
}

export interface Config {
  pages: string[]
  srcDir: string
  out: string
  publicDir: string
  /**
   * If files should be split or embedded inside files.
   *
   * @default true
   */
  codeSplitting: boolean
  /**
   * Where the root of the webpage is. This is most important to be set with
   * `codeSplitting` enabled
   *
   * @default '/'
   */
  root: string
  devServer: {
    port: number
  }
}

// If the config has been applied to the system
let _appliedConfig = false

export const getConfig = (path: string): Config => {
  const fileString = readFileSync(join(path, 'app.json')).toString()
  const parsed = JSON.parse(fileString)

  if (typeof parsed.pages == 'undefined') {
    throw new Error(
      'Error in "app.json": App config files must list pages to compile'
    )
  }

  const config = { ...defaultConfig, ...parsed } as Config

  if (!_appliedConfig) {
    applyConfig(config, path)
    _appliedConfig = true
  }

  return config
}

/**
 * Applies config changes to the meml transpiler
 *
 * @param config The project config
 */
export const applyConfig = (config: Config, path: string) => {
  MemlCore.rootPath = config.root
  MemlCore.shouldLink = config.codeSplitting
  MemlCore.distPath = join(path, config.out)
}
