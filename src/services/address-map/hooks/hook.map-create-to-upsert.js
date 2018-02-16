module.exports = function (upsertQuery) {
  if (typeof upsertQuery !== 'function') {
    console.warn('No `upsertQuery` function was passed to the mapCreateToUpsert hook. Please set params.upsertQuery in the hook context to dynamically declare the function.')
  }

  return function mapCreateToUpsert (context) {
    const { service, data, params } = context // const data = { address: '123', identifier: 'my-identifier' }

    upsertQuery = params.upsertQuery || upsertQuery
    if (typeof upsertQuery !== 'function') {
      throw new Error('you must pass a `upsertQuery` function to the mapCreateToUpsert hook in the options or as `params.upsertQuery` in the hook context')
    }

    params.mongoose = Object.assign({}, params.mongoose, { upsert: true })
    params.query = upsertQuery(context) // { address: '123' }

    return service.patch(null, data, params)
      .then(result => {
        // console.log(data, params)
        context.result = result[0]
        return context
      })
  }
}
