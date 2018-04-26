// Initializes the `dedupefix` service on path `/dedupefix`

module.exports = function () {
  const app = this

  app.use('/dedupefix', {
    get (id, params) {
      return Promise.resolve({ asdf: 1 })
    }
  })

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('dedupefix')

  service.hooks({
    before: {
      all: [],
      find: [],
      get: [
        context => {
          console.log('made it') // shout out to Quorra

          const portfolioAddressesServices = app.service('portfolio-addresses')
          return portfolioAddressesServices.find({})
            .then(response => {
              const allRecords = response.data
              const dedupedMap = {}
              const deletePromises = []

              allRecords.forEach(data => {
                const dupeKey = [
                  data.portfolioId,
                  (data.type || '').toUpperCase(),
                  ~~(data.index),
                  !!data.isChange
                ].join('_')
                dedupedMap[dupeKey] = dedupedMap[dupeKey] || data
                if (data !== dedupedMap[dupeKey]) { // current is duplicate
                  let prom = portfolioAddressesServices.remove(data._id.toString())
                  deletePromises.push(prom)
                }
              })

              return Promise.all(deletePromises)
                .then(results => {
                  context.result = { dedupe: 'success', data: results }
                  return Promise.resolve(context)
                })
            })
        }
      ],
      create: [],
      update: [],
      patch: [],
      remove: []
    },

    after: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    },

    error: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    }
  })

  if (service.filter) {
    service.filter({
      // disable all events for this service by returning false
      all: [(data) => false],
      create: [],
      update: [],
      patch: [],
      remove: []
    })
  }
}
