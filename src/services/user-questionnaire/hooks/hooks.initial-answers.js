module.exports = function (app) {
  return function (context) {
    return app.service('questions').find({ query: { questionaireId: context.data.questionnaireId } })
    .then(result => {
      context.data.answers = new Array(result.total)
    })
  }
}
