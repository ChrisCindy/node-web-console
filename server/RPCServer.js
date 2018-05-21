const crypto = require('crypto')
const os = require('os')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
require('natural-compare-lite')
const jayson = require('jayson')
const config = require('../config')

function getHash (algorithm, str) {
  const hash = crypto.createHash(algorithm)
  hash.update(str.trim())
  return hash.digest('hex')
}

function isDirectory (thePath) {
  return fs.existsSync(thePath) && fs.statSync(thePath).isDirectory()
}

// Command execution
function executeCommand (command) {
  return execSync(`${command} 2>&1`, {
    encoding: 'utf8'
  })
}

// Initializing
if (config.user && config.password) {
  config.accounts[config.user] = config.password
}
const isConfigured = config.noLogin || Object.keys(config.accounts).length >= 1

// RPC Server
let HOME_DIRECTORY = ''

const methods = {
  error: (message) => {
    throw new Error(message)
  },

  // Authentication
  authenticateUser: (user, password) => {
    user = user.trim()
    password = password.trim()
    if (user && password) {
      if (config.accounts[user]) {
        if (config.passwordHashAlgorithm) {
          password = getHash(config.passwordHashAlgorithm, password)
        }
        if (password === config.accounts[user]) {
          return `${user}:${getHash('sha256', password)}`
        }
      }
    }
    throw new Error('Incorrect user or password')
  },
  authenticateToken: (token) => {
    if (config.noLogin) {
      return true
    }
    token = token.trim()
    const tokenParts = token.split(':', 2)

    if (tokenParts.length === 2) {
      const user = tokenParts[0].trim()
      const passwordHash = tokenParts[1].trim()

      if (user && passwordHash) {
        if (config.accounts) {
          const realPasswordHash = getHash('sha256', config.accounts[user])
          if (passwordHash === realPasswordHash) {
            return user
          }
        }
      }
    }

    throw new Error('Incorrect user or password')
  },
  getHomeDirectory: (user) => {
    if (typeof config.homeDirectory === 'string') {
      if (config.homeDirectory) {
        return config.homeDirectory
      }
    } else if (typeof user === 'string' && user && config.homeDirectory.user) {
      return config.homeDirectory.user
    }
    return process.cwd()
  },

  // Environment
  getEnvironment: () => {
    return {
      path: process.cwd(),
      hostname: os.hostname()
    }
  },
  setEnvironment: (environment = {}, methods) => {
    const thePath = environment.path || HOME_DIRECTORY
    if (thePath) {
      if (isDirectory(thePath)) {
        try {
          process.chdir(thePath)
        } catch (e) {
          return {
            output: 'Unable to change directory to current working directory, updating current directory',
            environment: methods.getEnvironment.handler()
          }
        }
      }
    } else {
      return {
        output: 'Current working directory not found, updating current directory',
        environment: methods.getEnvironment.handler()
      }
    }
  },

  // Initialization
  initialize: (token, environment, methods) => {
    const user = methods.authenticateToken.handler(token)
    HOME_DIRECTORY = methods.getHomeDirectory.handler(user)
    const result = methods.setEnvironment.handler(environment, methods)
    if (result) {
      return result
    }
  },

  // Methods
  login: (user, password, methods) => {
    const result = {
      token: methods.authenticateUser.handler(user, password),
      environment: methods.getEnvironment.handler()
    }
    const homeDirectory = methods.getHomeDirectory.handler(user)
    if (homeDirectory) {
      if (isDirectory(homeDirectory)) {
        result.environment.path = homeDirectory
      } else {
        result.output = `Home directory not found: ${homeDirectory}`
      }
    }
    return result
  },
  cd: (token, environment, thePath, methods) => {
    const result = methods.initialize.handler(token, environment, methods)
    if (result) {
      return result
    }
    thePath = thePath.trim()
    if (!thePath) {
      thePath = HOME_DIRECTORY
    }
    if (thePath) {
      if (isDirectory(thePath)) {
        try {
          process.chdir(thePath)
        } catch (e) {
          return {
            output: `cd ${thePath}: Unable to change directory`
          }
        }
      } else {
        return {
          output: `cd ${thePath}: No such directory`
        }
      }
    }
    return {
      environment: methods.getEnvironment.handler()
    }
  },
  completion: (token, environment, pattern, command, methods) => {
    const result = methods.initialize.handler(token, environment, methods)
    if (result) {
      return result
    }
    let scanPath = ''
    let completionPrefix = ''
    let completion = []

    if (pattern) {
      if (!isDirectory(pattern)) {
        pattern = path.dirname(pattern)
        pattern = pattern === '.' ? '' : pattern
      }
      if (pattern) {
        if (isDirectory(pattern)) {
          scanPath = completionPrefix = pattern
          if (completionPrefix.substr(-1) !== '/') {
            completionPrefix += '/'
          }
        }
      } else {
        scanPath = process.cwd()
      }
    } else {
      scanPath = process.cwd()
    }

    if (scanPath) {
      // Loading directory listing
      completion = fs.readdirSync(scanPath)
      completion.sort(String.naturalCompare)

      // Prefix
      if (completionPrefix && completion.length > 0) {
        completion = completion.map(c => completionPrefix + c)
      }
      // Pattern
      if (pattern && completion.length > 0) {
        completion = completion.filter(c => {
          return pattern === c.substr(0, pattern.length)
        })
      }
    }

    return {
      completion
    }
  },

  run: (token, environment, command, methods) => {
    const result = methods.initialize.handler(token, environment, methods)
    if (result) {
      return result
    }
    let output = command ? executeCommand(command) : ''
    if (output && output.substr(-1) === '\n') {
      output = output.substr(0, output.length - 1)
    }
    return {
      output
    }
  }
}

const RPCServer = jayson.server(methods, {
  router (method, params) {
    return (p, cb) => {
      try {
        const result = this._methods[method].handler(...p, this._methods)
        cb(null, result)
      } catch (e) {
        console.log(e)
        const error = {
          code: 500,
          message: e.message || 'Internal Error'
        }
        cb(error)
      }
    }
  }
})

module.exports = {
  RPCServer,
  isConfigured,
  noLogin: config.noLogin
}
