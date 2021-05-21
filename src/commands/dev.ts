import { existsSync, mkdirSync } from "fs"
import Listr from "listr"
import { join } from "path/posix"
import prompts from "prompts"

import { getConfig } from "../utils"
import { init } from "./init"

export const dev = async (path: string) => {
    const folderExists = existsSync(path)
    const appExists = existsSync(join(path, 'app.json'))

    if (!folderExists) {
        const shouldInit = await prompts({
            type: 'confirm',
            name: 'create',
            message:
                'This folder doesn\'t exist, do you want to initialize it?',
        })

        if (shouldInit.create) {
            await init(path)
        } else {
            throw new Error('Cannot call dev on an directory that doesn\'t exists')
        }
    }

    if (!appExists) {
        const shouldInit = await prompts({
            type: 'confirm',
            name: 'create',
            message:
                'This workspace is not complete. Do you want to initialize it?',
        })

        if (shouldInit.create) {
            await init(path)
        }
    }

    let config

    new Listr([
        {
            title: 'Get config file',
            task: () => {
                config = getConfig(path)
            },
        },
    ]).run()
}