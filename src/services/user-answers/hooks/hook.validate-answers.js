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
      if (Array.isArray(userAnswer)) {
        const selectedOptions = userAnswer.map(answerText => {
          let selected = answerOptions.find(option => option.answer === answerText)
          if (!selected && answerText) {
            selected = answerOptions.find(option => option.answer === 'CUSTOM')
          }
          return selected
        })
        if (selectedOptions.some(option => !option)) {
          return false
        }
        if (selectedOptions.filter(option => option.answer === 'CUSTOM').length > 1) {
          return false
        }
        // For multi question type, skip to the farthest index or to the final question if available.
        option = selectedOptions.reduce((prev, curr) => {
          const currHasSkipTo = curr.hasOwnProperty('skipTo')
          const currHasFinalIndex = curr.hasOwnProperty('finalQuestion')
          const prevHasSkipTo = prev.hasOwnProperty('skipTo')
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
      if (!option && userAnswer) {
        option = answerOptions.find(ans => ans.answer === 'CUSTOM')
      }
    }
    if (option) {
      if (option.finalQuestion) {
        return userAnswers.slice(i + 1).every(ans => ans === null)
      }
      if (option.skipTo) {
        // skipTo is based on question numbers (it starts at 1)
        if (userAnswers.slice(i + 1, option.skipTo - 1).every(ans => ans === null)) {
          // -2 because the loop will increment before running again
          i = option.skipTo - 2
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
