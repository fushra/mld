import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

import Listr from 'listr'
import prompts from 'prompts'

import defaultStructure from './defaultStructure.json'

export const init = async (path: string) => {
  const folderExists = existsSync(path)

  if (folderExists) {
    const shouldWrite = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message:
        'This folder already exists, do you want to continue (this may overwrite some files)',
    })

    if (!shouldWrite) return
  }

  new Listr([
    {
      title: 'Creating directories',
      task: () => {
        // Create the root directory
        if (!folderExists) mkdirSync(path, { recursive: true })

        defaultStructure.folders.forEach((folder) =>
          mkdirSync(join(path, folder), { recursive: true })
        )
      },
    },
    {
      title: 'Creating files',
      task: () =>
        defaultStructure.files.forEach((file) =>
          writeFileSync(join(path, file.path), file.contents)
        ),
    },
  ]).run()
}
