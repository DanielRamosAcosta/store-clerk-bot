const config = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  CHECK_ENDPOINT:     process.env.CHECK_ENDPOINT     || 'https://www.pccomponentes.com/intel-core-i7-8700k-37ghz-box',
  ITEM_TITLE:         process.env.ITEM_TITLE         || 'i7 8700k',
  JQUERY_SLECTOR:     process.env.JQUERY_SLECTOR     || '#btnsWishAddBuy > button:nth-child(3)',
  MATCHING_REGEX:     process.env.MATCHING_REGEX     || 'avísame',
  CHECK_INTERVAL:     process.env.CHECK_INTERVAL     || '5m',
  REDIS_ENDPINT:      process.env.REDIS_ENDPINT      || 'redis://localhost:6379'
}

module.exports = config