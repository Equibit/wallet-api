const errors = require('feathers-errors')

module.exports = function (app) {
  return function (context) {
    let userQuestionaire = null
    if (context.method === 'patch') {
      userQuestionaire = app.service('user-answers').get(context.id.toString())
      .then(answers => app.service('user-questionaire').get(answers.userQuestionaireId))
    } else {
      userQuestionaire = app.service('user-questionaire').get(context.data.userQuestionaireId)
    }

    return userQuestionaire
    .then(data => app.service('questions').find({ query: data.questionareId }))
    .then(result => {
      const answers = context.data.answers
      // Validate the length of the array (size < questionaire numbers)
      if (answers.length > result.total) {
        return Promise.reject(new errors.BadRequest('More answers than available questions!'))
      }
      // Validate if each answer in the array is an actual answer from the questionaire
      const areAnswers = result.data.every((solution) => {
        const answer = answers[solution.sortIndex - 1]
        if (answer !== null) {
          if (solution.questionType === 'SINGLE' || solution.questionType === 'DROPDOWN') {
            return solution.answerOptions.includes(answer)
          } else {
            return Array.isArray(answer) &&
                answer.length > 0 &&
                answer.length <= solution.answerOptions.length &&
                answer.every((multiAnswer) => solution.answerOptions.includes(multiAnswer))
          }
        }
        return true
      })

      if (!areAnswers) {
        return Promise.reject(new errors.BadRequest('Answer array is invalid!'))
      }

      return Promise.resolve(context)
    })
  }
}
