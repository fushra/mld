import { join } from 'path'

// Store the last working directory to be accessed latter
let _lastWorkingDir: string

export const workingDir = process.cwd()

const _currentOrPath = (path?: string) => {
  if (typeof path != 'undefined') {
    return join(workingDir, path)
  }

  return workingDir
}

export const currentOrPath = (path?: string) => {
  _lastWorkingDir = _currentOrPath(path)
  return _lastWorkingDir
}

export const getLastWorkingDir = () => _lastWorkingDir
