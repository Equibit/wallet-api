const errors = require('feathers-errors')

// All answers must not be null with the exception of finalQuestion and skipTo cases.
// Every question after finalQuestion must be null.
// Every answer between the answer with skipTo and the skipTo index must be null.
function validateCompleteAnswers (questions, userAnswers) {
  for (let i = 0; i < userAnswers.length; i++) {
    const answerOptions = questions[i].answerOptions
    let userAnswer = userAnswers[i]
    const option = answerOptions.find(ans => userAnswer === ans.answer)

    if (option) {
      if (option.finalQuestion) {
        return userAnswers.slice(i + 1).every(ans => ans === null)
      }
      if (option.skipTo) {
        if (userAnswers.slice(i + 1, option.skipTo - 1).every(ans => ans === null)) {
          i = option.skipTo - 1
          userAnswer = userAnswers[i]
        } else {
          return false
        }
      }
    }

    if (userAnswer === null) {
      return false
    }
  }
  return true
}

module.exports = function (app) {
  return function (context) {
    if (context.data.status !== 'COMPLETED') {
      return context
    }

    return context.service.get(context.id)
      .then(userQuestionnaire => Promise.all([
        Promise.resolve(context.data.answers || userQuestionnaire.answers),
        app.service('questionnaires').get(userQuestionnaire.questionnaireId)
      ])
      ).then(res => {
        const userAnswers = res[0]
        const questions = res[1].questions
        if (!validateCompleteAnswers(questions, userAnswers)) {
          return Promise.reject(new errors.BadRequest('Completed answer array is invalid!'))
        }
        return Promise.resolve(context)
      })
  }
}
