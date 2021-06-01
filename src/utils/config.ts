import { readFileSync } from 'fs'
import { join } from 'path'

export const defaultConfig: Config = {
  pages: [],
  srcDir: 'src',
  out: 'build',
  publicDir: 'public',
  devServer: {
    port: 8080,
  },
}

export interface Config {
  pages: string[]
  srcDir?: string
  out?: string
  publicDir?: string
  devServer?: {
    port: number
  }
}

export const getConfig = (path: string): Config => {
  const fileString = readFileSync(join(path, 'app.json')).toString()
  const parsed = JSON.parse(fileString)

  if (typeof parsed.pages == 'undefined') {
    throw new Error(
      'Error in "app.json": App config files must list pages to compile'
    )
  }

  return { ...defaultConfig, ...parsed } as Config
}
