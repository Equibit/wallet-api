const faker = require('faker')
const objectid = require('objectid')
const randomFloat = require('random-float')
const randomInt = require('random-int')

exports.faker = faker
exports.objectid = objectid
exports.randomFloat = randomFloat
exports.randomInt = randomInt

// BTC has 8 decimals:
exports.randomBtc = function randomBtc (min, max) {
  return Math.floor(randomFloat(min, max) * 100000000) / 100000000
}
