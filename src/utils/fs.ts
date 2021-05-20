import { join } from 'path'

export const workingDir = process.cwd()

export const currentOrPath = (path?: string) => {
  if (typeof path != 'undefined') {
    return join(workingDir, path)
  }

  return workingDir
}
