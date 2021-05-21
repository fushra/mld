import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

import Listr from 'listr'
import prompts from 'prompts'

import defaultStructure from './defaultStructure.json'

export const init = async (path: string) => {
  const folderExists = existsSync(path)

  await new Listr([
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
        defaultStructure.files.forEach((file) => {
          if (!existsSync(join(path, file.path))) {
            if (file.type == 'text')
              writeFileSync(join(path, file.path), file.contents as string)
            if (file.type == 'json')
              writeFileSync(
                join(path, file.path),
                JSON.stringify(file.contents as Object)
              )
          }
        }),
    },
  ]).run()
}

export const checkInit = async (path: string) => {
  const folderExists = existsSync(path)

  if (!folderExists) {
    const shouldInit = await prompts({
      type: 'confirm',
      name: 'create',
      message: "This folder doesn't exist, do you want to initialize it?",
    })

    if (shouldInit.create) {
      await init(path)
    } else {
      throw new Error("Cannot call dev on an directory that doesn't exists")
    }
  }

  const appExists = existsSync(join(path, 'app.json'))

  if (!appExists) {
    const shouldInit = await prompts({
      type: 'confirm',
      name: 'create',
      message: 'This workspace is not complete. Do you want to initialize it?',
    })

    if (shouldInit.create) {
      await init(path)
    }
  }
}
