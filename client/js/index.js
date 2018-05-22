// CSS
import 'normalize.css'
import 'jquery.terminal/css/jquery.terminal.min.css'
import '../css/index.css'

const $ = require('jquery')
const jt = require('jquery.terminal')
jt(window, $)
require('jquery-mousewheel')($)

const settings = {
  // url: `//${window.location.hostname}:4000/`,
  url: `/rpc`,
  promptPathLength: 32,
  domain: document.domain || window.location.host,
  isSmallWindow: $(document).width() < 625
}
const environment = {
  user: '',
  hostname: '',
  path: ''
}
/* global NO_LOGIN */
const noLogin = NO_LOGIN
let silentMode = false

// Default banner
let bannerMain = 'Node Web Console'
const bannerLink = 'https://github.com/ChrisCindy/node-web-console'
let bannerExtra = `${bannerLink}\n`

// Big banner
if (!settings.isSmallWindow) {
  bannerMain =
  '    _   __          __        _       __     __       ______                       __' +
  '\n   / | / /___  ____/ /__     | |     / /__  / /_     / ____/___  ____  _________  / /__ ' +
 '\n  /  |/ / __ \\/ __  / _ \\    | | /| / / _ \\/ __ \\   / /   / __ \\/ __ \\/ ___/ __ \\/ / _ \\' +
'\n / /|  / /_/ / /_/ /  __/    | |/ |/ /  __/ /_/ /  / /___/ /_/ / / / (__  ) /_/ / /  __/' +
'\n/_/ |_/\\____/\\__,_/\\___/     |__/|__/\\___/_.___/   \\____/\\____/_/ /_/____/\\____/_/\\___/ '
  bannerExtra = `\n${bannerLink}\n`
}

let terminal = null

init()

function init () {
  terminal = $('.shell').terminal(interpreter, {
    login: !noLogin ? login : false,
    prompt: makePrompt(),
    greetings: !noLogin ? 'You are authenticated' : '',
    completion: completion,
    exceptionHandler: function (exception) {
      if (!silentMode) {
        terminal.exception(exception)
      }
    }
  }).css({
    overflow: 'auto'
  })

  // Logout
  if (noLogin) {
    terminal.set_token('NO_LOGIN')
  } else {
    logout()
    $(window).on('unload', () => {
      logout()
    })
  }

  // Banner
  if (bannerMain) {
    terminal.echo(bannerMain)
  }
  if (bannerExtra) {
    terminal.echo(bannerExtra)
  }
}

// Output
function showOutput (output) {
  if (output) {
    if (typeof output === 'string') {
      terminal.echo(output)
    } else if (output instanceof Array) {
      terminal.echo($.map(output, function (object) {
        return $.json_stringify(object)
      }).join(' '))
    } else if (typeof output === 'object') {
      terminal.echo($.json_stringify(output))
    } else {
      terminal.echo(output)
    }
  }
}

// Prompt
function makePrompt () {
  let path = environment.path
  if (path && path.length > settings.promptPathLength) {
    path = `...${path.slice(path.length - settings.promptPathLength + 3)}`
  }
  return `[[b;#d33682;]${(environment.user || 'user')}]@[[b;#6c71c4;]${(environment.hostname || settings.domain || 'node-web-console')}]${(path || '~')}$ `
}

function updatePrompt (terminal) {
  terminal.set_prompt(makePrompt())
}

// Environment
function updateEnvironment (terminal, data) {
  if (data) {
    $.extend(environment, data)
    updatePrompt(terminal)
  }
}

// Service
function service (terminal, method, parameters, success, error, options) {
  options = $.extend({ 'pause': true }, options)
  if (options.pause) {
    terminal.pause()
  }
  $.jrpc(settings.url, method, parameters, function (json) {
    if (options.pause) {
      terminal.resume()
    }

    if (!json.error) {
      if (success) {
        success(json.result)
      }
    } else if (error) {
      error()
    } else {
      let message = $.trim(json.error.message || '')
      let data = $.trim(json.error.data || '')

      if (!message && data) {
        message = data
        data = ''
      }
      terminal.error(`&#91;ERROR&#93; RPC: ${(message || 'Unknown error')}${(data ? (' (' + data + ')') : '')}`)
    }
  }, function (xhr, status, errorData) {
    if (options.pause) {
      terminal.resume()
    }

    if (error) {
      error()
    } else {
      if (status !== 'abort') {
        const response = $.trim(xhr.responseText || '')

        terminal.error(`&#91;ERROR&#93; AJAX: ${(status || 'Unknown error')}${(response ? ('\nServer reponse:\n' + response) : '')}`)
      }
    }
  })
}

function serviceAuthenticated (terminal, method, parameters, success, error, options) {
  const token = terminal.token()
  if (token) {
    const serviceParameters = [token, environment]
    if (parameters && parameters.length) {
      serviceParameters.push.apply(serviceParameters, parameters)
    }
    service(terminal, method, serviceParameters, success, error, options)
  } else {
    // Should never happen
    terminal.error('&#91;ERROR&#93; Access denied (no authentication token found)')
  }
}

// Interpreter
function interpreter (command, terminal) {
  command = $.trim(command || '')
  if (!command) {
    return
  }

  const commandParsed = $.terminal.parse_command(command)
  let method = null
  let parameters = []

  if (commandParsed.name.toLowerCase() === 'cd') {
    method = 'cd'
    parameters = [commandParsed.args.length ? commandParsed.args[0] : '']
  } else {
    method = 'run'
    parameters = [command]
  }

  if (method) {
    serviceAuthenticated(terminal, method, parameters, function (result) {
      updateEnvironment(terminal, result.environment)
      showOutput(result.output)
    })
  }
}

// Login
function login (user, password, callback) {
  user = $.trim(user || '')
  password = $.trim(password || '')

  if (user && password) {
    service(terminal, 'login', [user, password], function (result) {
      if (result && result.token) {
        environment.user = user
        // FIXME: updateEnvironment not work Synchronously
        setTimeout(() => {
          updateEnvironment(terminal, result.environment)
        }, 0)
        showOutput(result.output)
        callback(result.token)
      } else {
        callback(null)
      }
    }, function () {
      callback(null)
    })
  } else {
    callback(null)
  }
}

// Completion
function completion (pattern, callback) {
  const view = this.terminal().export_view()
  const command = view.command.substring(0, view.position)

  serviceAuthenticated(terminal, 'completion', [pattern, command], function (result) {
    showOutput(result.output)

    if (result.completion && result.completion.length) {
      result.completion.reverse()
      callback(result.completion)
    }
  }, null, { pause: false })
}

// Logout
function logout () {
  silentMode = true

  try {
    terminal.clear()
    terminal.logout()
  } catch (error) { }

  silentMode = false
}
