import { existsSync, readFileSync, writeFileSync } from 'fs'
import { mkdirSync } from 'fs-extra'
import Listr from 'listr'
import { join } from 'path'
import prompts from 'prompts'
import simpleGit from 'simple-git/promise'

import { Config, getConfig } from '../utils'
import { checkInit } from './init'

const gitRegexp = /(\w|_|-)+\/(\w|_|-)+\.git/

export const deploy = async (path: string) => {
  await checkInit(path)

  let config: Config
  let diskConfig = JSON.parse(readFileSync(join(path, 'app.json')).toString())

  config = getConfig(path)

  const response = await prompts([
    {
      type: 'select',
      name: 'provider',
      message: 'Choose a hosting provider',
      choices: [
        { title: 'Github pages', value: 'gh' },
        { title: 'Cloudflare pages', value: 'cf' },
        { title: 'Vercel', value: 'v' },
        { title: 'Netlify', value: 'n' },
      ],
    },
  ])

  const hasGitRepo = existsSync(join(path, '.git'))
  const git = simpleGit(path)

  if (!hasGitRepo) {
    console.log(
      `Please create an empty${
        response.provider == 'gh' ? ' (public)' : ''
      } git repo on ${
        response.provider == 'gh' ? 'github' : 'your git provider of choice'
      } and paste it below`
    )

    // Force this to be an initialized git repo
    const gitRepo = (
      await prompts({
        type: 'text',
        name: 'repo',
        message: 'Provide a git repo',
      })
    ).repo

    if (typeof gitRepo == 'undefined') return

    await git.init()
    await git.checkoutLocalBranch('main')
    await git.add('.')
    await git.commit('Initialize repo')
    await git.addRemote('origin', gitRepo)
    await git.push('origin', 'main')
  }

  const remotes = await git.getRemotes(true)
  const origin = remotes.filter((remote) => remote.name == 'origin')[0].refs

  const isGithub = origin.push.includes('github.com')
  const originPath = gitRegexp.exec(origin.push)[0].toString()

  const username = originPath.replace('.git', '').split('/')[0]
  const repo = originPath.replace('.git', '').split('/')[1]

  if (response.provider == 'gh') {
    if (!isGithub) {
      console.error(
        'The repo must be hosted on github to use github pages as a hosting source'
      )
      return
    }

    // Check if the repo name is not [username].github.io
    if (repo.toLowerCase() != `${username}.github.io`) {
      // Therefore, the root option in config must be set to be /[repo]/
      diskConfig.root = `/${repo}/`
    }

    // Make sure the output will be in the build directory
    diskConfig.out = 'build'

    // Write a github action to the repository that will automatically deploy the webpage
    mkdirSync(join(path, '.github', 'workflows'), { recursive: true })
    writeFileSync(
      join(path, '.github', 'workflows', 'ghpages.yml'),
      readFileSync(join(__dirname, 'ghpages.yml'))
    )

    console.log(
      `Open your repositories' settings tab (https://github.com/${username}/${repo}/settings/pages) and change the source to be 'gh-pages'. You might need to wait a few minutes for the deployment to finish. Click save and go to https://${username}.github.io/${repo}/`
    )
  }

  if (response.provider == 'cf') {
    diskConfig.root = 'dist'

    console.log(
      'Go to your cloudflare pages, dashboard and select your repo. Leave all the default options and click "Save and Deploy"'
    )
  }

  writeFileSync(join(path, 'app.json'), JSON.stringify(diskConfig))

  await git.add('.')
  await git.commit('Setup deployment')
  await git.push('origin', 'main', ['--set-upstream'])
}
