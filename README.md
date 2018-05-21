```
    _   __          __        _       __     __       ______                       __   
   / | / /___  ____/ /__     | |     / /__  / /_     / ____/___  ____  _________  / /__ 
  /  |/ / __ \/ __  / _ \    | | /| / / _ \/ __ \   / /   / __ \/ __ \/ ___/ __ \/ / _ \
 / /|  / /_/ / /_/ /  __/    | |/ |/ /  __/ /_/ /  / /___/ /_/ / / / (__  ) /_/ / /  __/
/_/ |_/\____/\__,_/\___/     |__/|__/\___/_.___/   \____/\____/_/ /_/____/\____/_/\___/ 
                                                                                        
```
## Summary
Node Web Console is a web-based Node.js application that allows to execute shell commands on a server directly from a browser (web-based SSH). This project is inspired by the php-based [web-console](https://github.com/nickola/web-console). 
The application is very light, does not require any database and can be installed and configured in about 3 minutes.

## Features
- Clean interface, which looks and feels like a real shell terminal
- Easy to extend. Node-Web-Console uses [Koa](https://github.com/koajs/koa) to start the web server. You can easily extend it or integrate it to your own project.
- Secure. You can configure HTTPS (SSL) on your web server and all Node Web Console traffic will be protected. Also, Node Web Console has a mark to search engines that will disallow the Node Web Console page from indexing.
- Fast configuration. Node Web Console is a pure Node.js project and can be installed and configured quickly.


## Installation

Node Web Console uses [Koa](https://github.com/koajs/koa) to start the web server, so it requires node v7.6.0 or higher.

```shell
git clone https://github.com/ChrisCindy/node-web-console.git
cd node-web-console

# instal dependencies 
npm install
```

## Getting Started

- configure the settings

  open `config/index.js` and enter your `$USER` and `$PASSWORD` credentials, edit any other settings that you like (see description in the comments).

- start the web server

  - Development mode

  ```shell
  ## build and watch client side scripts and stylesheets
  npm run client:dev

  ## open another shell 
  ## start the web server
  npm run server:dev
  ```

  - Production mode

  ```shell
  ## build and minify client side scripts and stylesheets
  npm run client:build

  ## start the server with pm2 
  npm run prod
  ```

- open http://localhost:3000/console in your browser and enjoy it

## License
Node Web Console is licensed under [GNU LGPL Version 3](http://www.gnu.org/licenses/lgpl.html) license.
