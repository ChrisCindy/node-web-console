const Koa = require('koa')
const serve = require('koa-static')
const views = require('koa-views')
const bodyParser = require('koa-bodyparser')
const c2k = require('koa-connect')
const Router = require('koa-router')
const mount = require('koa-mount')
const path = require('path')
const { RPCServer, isConfigured, noLogin } = require('./RPCServer')

const server = new Koa()
server.use(bodyParser())
server.use(async (ctx, next) => {
  try {
    ctx.req.body = ctx.request.body
    await next()
  } catch (err) {
    ctx.status = 500
    ctx.message = err.message || 'Sorry, an error has occurred.'
  }
})

server.use(views(path.join(__dirname, '../views'), {
  extension: 'pug'
}))

server.use(mount('/static', serve(path.join(__dirname, '../static'))))

const router = new Router()
router.get('/console', async (ctx) => {
  if (isConfigured) {
    await ctx.render('index', {
      NO_LOGIN: noLogin
    })
  } else {
    await ctx.render('unauthorized')
  }
})
router.post('/rpc', c2k(RPCServer.middleware()))

server.use(router.routes()).use(router.allowedMethods())

server.listen(3000)
console.log('server started and listens on port 3000')
