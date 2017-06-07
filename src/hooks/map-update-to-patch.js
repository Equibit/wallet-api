module.exports = function () {
  return function mapUpdateToPatch (context) {
    const { service, id, data, params } = context
    return service.patch(id, data, params)
      .then(result => {
        context.result = result
        return context
      })
  }
}
