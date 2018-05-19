# Node-Web-Console
Node Web Console is a web-based Node.js application that allows to execute shell commands on a server directly from a browser (web-based SSH). This project is inspired by the php-based [web-console](https://github.com/nickola/web-console). 
The application is very light, does not require any database and can be installed and configured in about 3 minutes.

## Features
- Clean interface, which looks and feels like a real shell terminal
- Easy to extend. Node-Web-Console uses [Koa](https://github.com/koajs/koa) to start the web server. You can easily extend it or integrate it to your own project.
- Secure. You can configure HTTPS (SSL) on your web server and all Node Web Console traffic will be protected. Also, Node Web Console has a mark to search engines that will disallow the Node Web Console page from indexing.
- Fast configuration. Node Web Console is a pure Node.js project and can be installed and configured quickly.


## Installation

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

  ```shell
  npm run dev
  ```
- open http://localhost:3000/console in your browser

## License
Node Web Console is licensed under [GNU LGPL Version 3](http://www.gnu.org/licenses/lgpl.html) license.
