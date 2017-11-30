const Telegraf = require('telegraf')
const axios = require('axios')
const cheerio = require('cheerio')
const ms = require('ms')
const util = require('util')
const Redis = require('redis')

const config = require('./config')
const redisCB = Redis.createClient(config.REDIS_ENDPINT, {
  retry_strategy: options => 1000
})

const redis = {
  get: util.promisify(redisCB.get).bind(redisCB),
  set: util.promisify(redisCB.set).bind(redisCB),
  rpush: util.promisify(redisCB.rpush).bind(redisCB),
  lrange: util.promisify(redisCB.lrange).bind(redisCB),
  lrem: util.promisify(redisCB.lrem).bind(redisCB),
}

const telegram = new Telegraf.Telegram(config.TELEGRAM_BOT_TOKEN)
const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN)

const checkTime = ms(config.CHECK_INTERVAL)
const regex = new RegExp(config.MATCHING_REGEX, 'i')

const help = `I'm the store clerk, I'll send you a message when there is stock of the ${config.ITEM_TITLE}.

You can control me by sending these commands:

/join - start listening
/checknow - returns if its available
/revisions - check number of revisions
/cancel - cancel your listening`

bot.start(ctx => {
  return ctx.reply(help)
})

bot.command('join', async ctx => {
  const userId = ctx.message.from.id.toString()
  const users = await redis.lrange('users', 0, -1)
  const index = users.indexOf(userId)
  if (index < 0) {
    await redis.rpush('users', userId)
    ctx.reply("You've been suscribed successfully, use /cancel to cancel it")
  } else {
    ctx.reply('You are already suscribed')
  }
})

bot.command('revisions', async ctx => {
  ctx.reply(`I've checked ${(await redis.get('counter')) || 0} times`)
})

bot.command('checknow', async ctx => {
  ctx.reply('Checking stock...')
  const isAvailable = await checkStock()
  console.log(isAvailable)
  if (isAvailable) {
    broadcastAvailable()
  } else {
    ctx.reply("There isn't stock yet...")
  }
})

bot.command('cancel', async ctx => {
  const userId = ctx.message.from.id.toString()
  const users = await redis.lrange('users', 0, -1)
  const index = users.indexOf(userId)

  if (index < 0) {
    return ctx.reply("You aren't suscribed")
  }

  await redis.lrem('users', 0, userId)
  ctx.reply('You have unsuscribed 😢')
})

bot.command('help', ctx => {
  ctx.reply(help)
})

async function broadcastAvailable() {
  const users = await redis.lrange('users', 0, -1)
  users.forEach(user => {
    telegram.sendMessage(
      user,
      `⚠ ${config.ITEM_TITLE} IS AVAILABLE ⚠\n\n${config.CHECK_ENDPOINT}`
    )
  })
}

async function checkStock() {
  await redis.set(
    'counter',
    parseInt(await redis.get('counter') || 0, 10) + 1
  )
  const { data } = await axios.get(config.CHECK_ENDPOINT)
  const $ = cheerio.load(data)
  const text = $(config.JQUERY_SLECTOR).text()
  console.log(text)
  return !regex.test(text)
}

async function iterate() {
  const stock = await checkStock()
  if (stock) {
    broadcastAvailable()
  }
}

setInterval(() => {
  iterate().catch(err => {
    console.error(err)
  })
}, checkTime)

bot.startPolling()
