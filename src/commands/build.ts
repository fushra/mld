import { join, dirname } from 'path'
import { existsSync, mkdir, readFile, writeFile } from 'fs-extra'
import Listr from 'listr'

import { Config, getConfig } from '../utils'
import { MemlC } from 'meml'
import { checkInit } from './init'

const compilerReset = () => {
  MemlC.hadError = false
  MemlC.errors = ''
}

const compileFile = async (path: string): Promise<string> => {
  compilerReset()

  const compiler = new MemlC()
  const fileContents = (await readFile(path)).toString()

  return compiler.translate(fileContents, path)
}

const compileFromConfig = async (
  path: string,
  config: Config
): Promise<Map<string, string>> => {
  let compiledFiles = new Map()

  for (let file of config.pages) {
    if (!file.includes('.meml')) file += '.meml'

    const storePath = join(path, config.out, file.replace('.meml', '.html'))
    const compiled = await compileFile(join(path, config.srcDir, file))

    if (!existsSync(dirname(storePath))) {
      await mkdir(dirname(storePath), { recursive: true })
    }
    await writeFile(storePath, compiled)
  }

  return compiledFiles
}

export const build = async (path: string) => {
  await checkInit(path)

  let config: Config

  await new Listr([
    {
      title: 'Get config file',
      task: async () => (config = getConfig(path)),
    },
    {
      title: 'Create folders',
      task: async () =>
        await mkdir(join(path, config.out), { recursive: true }),
    },
    {
      title: 'Compile',
      task: async () => await compileFromConfig(path, config),
    },
  ]).run()
}
