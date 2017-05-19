exports.create = function createUser (app) {
  return app.service('/users').create({ email: 'test@equibit.org' })
    .then(user => app.service('/users').find({ query: {} }))
    .then(users => {
      users = users.data || users
      return users[0]
    })
}

exports.removeAll = function remove (app) {
  return app.service('/users').remove(null, {})
}
