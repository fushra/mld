import { readFileSync } from "fs"
import { join } from "path"

interface Config {
    pages: string[]
}

export const getConfig = (path: string): Config => {
    const fileString = readFileSync(join(path, 'app.json')).toString()
    const parsed = JSON.parse(fileString)

    if (typeof parsed.pages == 'undefined') {
        throw new Error('Error in "app.json": App config files must list pages to compile')
    }

    return parsed as Config
}
