exports.removeUsers = function removeUsers (app) {
  return function (done) {
    app.service('/users')
      .remove(null, {})
      .then(() => {
        done()
      })
      .catch(error => { console.log(error) })
  }
}
