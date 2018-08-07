const errors = require('feathers-errors')

// All answers must not be null with the exception of finalQuestion and skipTo cases.
// Every question after finalQuestion must be null.
// Every answer between the answer with skipTo and the skipTo index must be null.
function validateAnswers (questions, userAnswers) {
  if (questions.length !== userAnswers.length) {
    return false
  }

  for (let i = 0; i < userAnswers.length; i++) {
    const { answerOptions, questionType } = questions[i]
    let userAnswer = userAnswers[i]
    let option = null
    if (questionType === 'MULTI') {
      const answers = answerOptions.map(ans => ans.answer)
      if (Array.isArray(userAnswer) && userAnswer.every(ans => answers.indexOf(ans) !== -1)) {
        // For multi question type, skip to the farthest index or to the final question if available.
        option = userAnswer.reduce((prev, curr) => {
          const currHasSkipTo = curr.hasOwnProperty('skipTo')
          const currHasFinalIndex = curr.hasOwnProperty('finalQuestion')
          const prevHasSkipTo = curr.hasOwnProperty('skipTo')
          if (currHasFinalIndex || (currHasSkipTo && prevHasSkipTo && curr.skipTo > prev.skipTo)) {
            return curr
          } else {
            return prev
          }
        })
      } else {
        return false
      }
    } else {
      option = answerOptions.find(ans => userAnswer === ans.answer)
    }

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
    } else {
      return false
    }
  }

  return true
}

module.exports = function (app) {
  return function (context) {
    return app.service('questionnaires').get(context.data.questionnaireId)
      .then(questionnaire => {
        const { questions } = questionnaire
        const userAnswers = context.data.answers
        if (!validateAnswers(questions, userAnswers)) {
          return Promise.reject(new errors.BadRequest('Completed answer array is invalid!'))
        }
        return Promise.resolve(context)
      })
  }
}
