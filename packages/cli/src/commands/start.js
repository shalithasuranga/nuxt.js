import fs from 'fs'
import path from 'path'
import parseArgs from 'minimist'
import consola from 'consola'

import { loadNuxtConfig } from '../common/utils'

export default async function start() {
  const { Nuxt } = await import('@nuxt/core')

  const argv = parseArgs(process.argv.slice(2), {
    alias: {
      h: 'help',
      H: 'hostname',
      p: 'port',
      n: 'unix-socket',
      c: 'config-file',
      s: 'spa',
      u: 'universal'
    },
    boolean: ['h', 's', 'u'],
    string: ['H', 'c', 'n'],
    default: {
      c: 'nuxt.config.js'
    }
  })

  if (argv.hostname === '') {
    consola.fatal('Provided hostname argument has no value')
  }

  if (argv.help) {
    process.stderr.write(`
    Description
      Starts the application in production mode.
      The application should be compiled with \`nuxt build\` first.
    Usage
      $ nuxt start <dir> -p <port number> -H <hostname>
    Options
      --port, -p            A port number on which to start the application
      --hostname, -H        Hostname on which to start the application
      --unix-socket, -n     Path to a UNIX socket
      --spa                 Launch in SPA mode
      --universal           Launch in Universal mode (default)
      --config-file, -c     Path to Nuxt.js config file (default: nuxt.config.js)
      --help, -h            Displays this message
  `)
    process.exit(0)
  }

  const options = loadNuxtConfig(argv)

  // Force production mode (no webpack middleware called)
  options.dev = false

  const nuxt = new Nuxt(options)

  // Setup hooks
  nuxt.hook('error', err => consola.fatal(err))

  // Check if project is built for production
  const distDir = path.resolve(
    nuxt.options.rootDir,
    nuxt.options.buildDir || '.nuxt',
    'dist',
    'server'
  )
  if (!fs.existsSync(distDir)) {
    consola.fatal(
      'No build files found, please run `nuxt build` before launching `nuxt start`'
    )
  }

  // Check if SSR Bundle is required
  if (nuxt.options.render.ssr === true) {
    const ssrBundlePath = path.resolve(distDir, 'server-bundle.json')
    if (!fs.existsSync(ssrBundlePath)) {
      consola.fatal(
        'No SSR build! Please start with `nuxt start --spa` or build using `nuxt build --universal`'
      )
    }
  }

  return nuxt.listen().then(() => {
    nuxt.showReady(false)
  })
}
