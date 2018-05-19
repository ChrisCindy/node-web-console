(function ($) {
  $(document).ready(function () {
    var settings = {
      url: '//localhost:4000/',
      promptPathLength: 32,
      'domain': document.domain || window.location.host,
      'is_small_window': $(document).width() < 625 ? true : false
    };
    var environment = { 'user': '', 'hostname': '', 'path': '' };
    var no_login = typeof (__NO_LOGIN__) !== 'undefined' ? __NO_LOGIN__ : false;
    var silentMode = false;

    // Default banner
    var banner_main = "Node Web Console";
    var banner_link = 'https://github.com/ChrisCindy/node-web-console';
    var banner_extra = banner_link + '\n';

    // Big banner
    if (!settings.is_small_window) {
      banner_main = 
      "    _   __          __        _       __     __       ______                       __" +    
      "\n   / | / /___  ____/ /__     | |     / /__  / /_     / ____/___  ____  _________  / /__ " + 
     "\n  /  |/ / __ \\/ __  / _ \\    | | /| / / _ \\/ __ \\   / /   / __ \\/ __ \\/ ___/ __ \\/ / _ \\" +
    "\n / /|  / /_/ / /_/ /  __/    | |/ |/ /  __/ /_/ /  / /___/ /_/ / / / (__  ) /_/ / /  __/" + 
   "\n/_/ |_/\\____/\\__,_/\\___/     |__/|__/\\___/_.___/   \\____/\\____/_/ /_/____/\\____/_/\\___/ ";
                                                                                        
      // banner_main = "" +
      //   "  _    _      _     _____                       _                " +
      //   "\n | |  | |    | |   /  __ \\                     | |            " +
      //   "\n | |  | | ___| |__ | /  \\/ ___  _ __  ___  ___ | | ___        " +
      //   "\n | |/\\| |/ _ \\ '_ \\| |    / _ \\| '_ \\/ __|/ _ \\| |/ _ \\ " +
      //   "\n \\  /\\  /  __/ |_) | \\__/\\ (_) | | | \\__ \\ (_) | |  __/  " +
      //   "\n  \\/  \\/ \\___|____/ \\____/\\___/|_| |_|___/\\___/|_|\\___| " +
      //   "";
      banner_extra = '\n                 ' + banner_link + '\n';
    }

    // Output
    function showOutput(output) {
      if (output) {
        if (typeof output === 'string') terminal.echo(output);
        else if (output instanceof Array) terminal.echo($.map(output, function (object) {
          return $.json_stringify(object);
        }).join(' '));
        else if (typeof output === 'object') terminal.echo($.json_stringify(output));
        else terminal.echo(output);
      }
    }

    // Prompt
    function makePrompt() {
      var path = environment.path;
      if (path && path.length > settings.promptPathLength)
        path = '...' + path.slice(path.length - settings.promptPathLength + 3);

      return '[[b;#d33682;]' + (environment.user || 'user') + ']' +
        '@[[b;#6c71c4;]' + (environment.hostname || settings.domain || 'web-console') + '] ' +
        (path || '~') +
        '$ ';
    }

    function updatePrompt(terminal) {
      terminal.set_prompt(makePrompt());
    }

    // Environment
    function updateEnvironment(terminal, data) {
      if (data) {
        $.extend(environment, data);
        updatePrompt(terminal);
      }
    }

    // Service
    function service(terminal, method, parameters, success, error, options) {
      options = $.extend({ 'pause': true }, options);
      if (options.pause) terminal.pause();

      $.jrpc(settings.url, method, parameters,
        function (json) {
          if (options.pause) terminal.resume();

          if (!json.error) {
            if (success) success(json.result);
          }
          else if (error) error();
          else {
            var message = $.trim(json.error.message || '');
            var data = $.trim(json.error.data || '');

            if (!message && data) {
              message = data;
              data = '';
            }

            terminal.error('&#91;ERROR&#93;' +
              ' RPC: ' + (message || 'Unknown error') +
              (data ? (" (" + data + ")") : ''));
          }
        },
        function (xhr, status, error_data) {
          if (options.pause) terminal.resume();

          if (error) error();
          else {
            if (status !== 'abort') {
              var response = $.trim(xhr.responseText || '');

              terminal.error('&#91;ERROR&#93;' +
                ' AJAX: ' + (status || 'Unknown error') +
                (response ? ("\nServer reponse:\n" + response) : ''));
            }
          }
        });
    }

    function serviceAuthenticated(terminal, method, parameters, success, error, options) {
      var token = terminal.token();
      if (token) {
        var serviceParameters = [token, environment];
        if (parameters && parameters.length)
          serviceParameters.push.apply(serviceParameters, parameters);
        service(terminal, method, serviceParameters, success, error, options);
      }
      else {
        // Should never happen
        terminal.error('&#91;ERROR&#93; Access denied (no authentication token found)');
      }
    }

    // Interpreter
    function interpreter(command, terminal) {
      command = $.trim(command || '');
      if (!command) return;

      var commandParsed = $.terminal.parse_command(command),
        method = null, parameters = [];

      if (commandParsed.name.toLowerCase() === 'cd') {
        method = 'cd';
        parameters = [commandParsed.args.length ? commandParsed.args[0] : ''];
      }
      else {
        method = 'run';
        parameters = [command];
      }

      if (method) {
        serviceAuthenticated(terminal, method, parameters, function (result) {
          updateEnvironment(terminal, result.environment);
          showOutput(result.output);
        });
      }
    }

    // Login
    function login(user, password, callback) {
      user = $.trim(user || '');
      password = $.trim(password || '');

      if (user && password) {
        service(terminal, 'login', [user, password], function (result) {
          if (result && result.token) {
            environment.user = user;
            updateEnvironment(terminal, result.environment);
            showOutput(result.output);
            callback(result.token);
          }
          else callback(null);
        },
          function () { callback(null); });
      }
      else callback(null);
    }

    // Completion
    function completion(pattern, callback) {  
      var view = this.terminal().export_view();
      var command = view.command.substring(0, view.position);

      serviceAuthenticated(terminal, 'completion', [pattern, command], function (result) {
        showOutput(result.output);

        if (result.completion && result.completion.length) {
          result.completion.reverse();
          callback(result.completion);
        }
      }, null, { pause: false });
    }

    // Logout
    function logout() {
      silentMode = true;

      try {
        terminal.clear();
        terminal.logout();
      }
      catch (error) { }

      silentMode = false;
    }

    // Terminal
    var terminal = $('body').terminal(interpreter, {
      login: !no_login ? login : false,
      prompt: makePrompt(),
      greetings: !no_login ? "You are authenticated" : "",
      tabcompletion: true,
      completion: completion,
      onBlur: function () { return false; },
      exceptionHandler: function (exception) {
        if (!silentMode) terminal.exception(exception);
      }
    });

    // Logout
    if (no_login) terminal.set_token('NO_LOGIN');
    else {
      logout();
      $(window).unload(function () { logout(); });
    }

    // Banner
    if (banner_main) terminal.echo(banner_main);
    if (banner_extra) terminal.echo(banner_extra);
  });
})(jQuery);
