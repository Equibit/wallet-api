module.exports = function () {
  return function (hook) {
    return hook.app.service('user-questionnaire').find()
      .then(res => {
        const completed = res.data.map(userQuestionnaire => userQuestionnaire.questionnaireId)
        if (hook.params.hasOwnProperty('query')) {
          if (hook.params.query.hasOwnProperty('_id')) {
            hook.params.query._id = Object.assign(hook.params.query._id, { $nin: completed })
          } else {
            hook.params.query._id = { $nin: completed }
          }
        } else {
          hook.params.query = {_id: { $nin: completed }}
        }
        return hook
      })
  }
}
