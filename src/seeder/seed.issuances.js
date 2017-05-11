const faker = require('faker')
const objectid = require('objectid')
const randomFloat = require('random-float')
const randomInt = require('random-int')

const issuanceSeries = [
  'Series 1',
  'Series 2',
  'Series 3'
]
const issuanceTypes = [
  'Common Shares',
  'Trust Units',
  'Bonds',
  'Preferred Shares'
]
const issuanceRestrictions = [
  null,
  1,
  2
]
// BTC has 8 decimals:
function randomBtc (min, max) {
  return Math.floor(randomFloat(min, max) * 100000000) / 100000000
}

/**
 * Seed the issuances collection.
 */
module.exports = function (app) {
  const seederService = app.service('seeder')

  // Read the `companies.seed.json`
  return seederService.get('seeder/companies.json')
    // Create an issuance assigned to a random company.
    .then(companies => {
      const issuances = []

      for (var i = 0; i < 100; i++) {
        let company = companies[randomInt(companies.length - 1)]
        let marketCap = randomBtc(1000, 10000)
        let change = randomBtc(-1000, 1000)
        const issuance = {
          _id: objectid(),
          companyId: company._id,
          companyName: company.name,
          companySlug: company.slug,
          domicile: faker.address.country(),
          issuanceName: issuanceSeries[randomInt(issuanceSeries.length - 1)],
          issuanceType: issuanceTypes[randomInt(issuanceTypes.length - 1)],
          restriction: issuanceRestrictions[randomInt(issuanceRestrictions.length - 1)],
          marketCap: marketCap,
          change: change,
          changePercentage: Math.floor(change / marketCap * 10000) / 100,

          // 24h stat data:
          highestBid: randomInt(50000, 100000),
          lowestAsk: randomInt(30000, 50000),
          highestNumShares: randomInt(1000, 2000),
          lowestNumShares: randomInt(500, 1000),

          // meta data:
          volume24h: randomInt(1000, 3000),
          sharesAuthorized: randomInt(1000, 5000),
          sharesIssued: randomInt(5000, 10000),
          sharesDividend: randomInt(500, 1000),
          sharesDividendYield: Math.round(randomFloat(0, 10) * 100) / 100,

          tradesNum: randomInt(10, 100)
        }
        company.issuances.push(issuance._id)
        issuances.push(issuance)
      }

      return seederService.create({
        path: 'services/companies/companies.seed.json',
        data: companies
      }).then(companies => {
        return seederService.create({
          path: 'services/issuances/issuances.seed.json',
          data: issuances
        })
      })
    })
}
