import { FSWatcher, watch } from 'chokidar'
import { existsSync } from 'fs'
import { readFileSync } from 'fs-extra'
import Listr from 'listr'
import { join } from 'path'
import { MemlCore } from 'meml'
import { Server } from 'socket.io'

import { Config, getConfig } from '../utils'
import { checkInit } from './init'
import { createServer } from 'http'
import { sleep } from '../utils/sleep'

const compileFile = async (path: string): Promise<string> => {
  MemlCore.resetErrors()

  const compiler = new MemlCore()
  const fileContents = await readFileSync(path).toString()

  return await compiler.sourceToWeb(fileContents, path)
}

const compileFromConfig = async (
  path: string,
  config: Config
): Promise<Map<string, string>> => {
  let compiledFiles = new Map()

  await sleep(100)

  await Promise.all(
    config.pages.map(async (file) => {
      if (!file.includes('.meml')) file += '.meml'

      const storePath = file.replace('.meml', '.html')
      let compiled = await compileFile(join(path, config.srcDir, file))

      if (compiled.includes('</head>')) {
        compiled = compiled.replace(
          '</head>',
          `<script src="/socket.io/socket.io.js"></script><script>const socket = io("http://localhost:${config.devServer.port}");socket.on("reload",() => window.location.reload());</script></head>`
        )
      } else {
        console.warn(
          `The file ${file} doesn't have a head and cannot have live reloading`
        )
        console.log(compiled)
      }

      compiledFiles.set(`/${storePath}`, compiled)
      if (storePath.includes('index.html'))
        compiledFiles.set(
          storePath.replace('index.html', '/').replace('//', '/'),
          compiled
        )
    })
  )

  return compiledFiles
}

export const dev = async (path: string) => {
  await checkInit(path)

  let config: Config
  let watcher: FSWatcher
  let files: Map<string, string>
  let server
  let io: Server

  await new Listr([
    {
      title: 'Get config file',
      task: async () => (config = getConfig(path)),
    },
    {
      title: 'Create watcher',
      task: () => {
        watcher = watch(join(path, config.srcDir))
      },
    },
    {
      title: 'Compile',
      task: async () => (files = await compileFromConfig(path, config)),
    },
    {
      title: `Start server`,
      task: (_ctx, task) =>
        new Promise<void>((resolve) => {
          task.title = `Start server on port ${config.devServer.port}`

          // Create the server
          server = createServer((req, res) => {
            if (files.has(req.url)) {
              res.writeHead(200, { 'Content-Type': 'text/html' })
              res.write(files.get(req.url))
              res.end()
            } else if (existsSync(join(path, config.publicDir, req.url))) {
              res.writeHead(200)
              res.write(readFileSync(join(path, config.publicDir, req.url)))
              res.end()
            } else {
              res.writeHead(404, { 'Content-Type': 'text/html' })
              res.write(
                'Could not find this file in your source code. Please try adding it to your config file'
              )
              res.end()
            }
          })

          // Add socket.io
          io = new Server(server)

          // Start listening
          server.listen(config.devServer.port, () => {
            // Leave some times for the socket sessions to sync then reload all that are connected
            setTimeout(() => {
              io.sockets.emit('reload')
              resolve()
            }, 500)
          })
        }),
    },
    {
      title: 'Start watching for changes',
      task: () => {
        const onModification = () => {
          new Listr([
            {
              title: 'Recompiling',
              task: async () => {
                files = await compileFromConfig(path, config)
                io.sockets.emit('reload')
              },
            },
          ]).run()
        }

        watcher.on('add', onModification).on('change', onModification)
      },
    },
  ]).run()
}
