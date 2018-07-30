const errors = require('feathers-errors')

// index - current index of user answer in the answer array
// answer - current user answer string
// answers - array of user string answers, multi-array string answers, or null
// possible - array of possible answer objects
function validateAnswer (index, answer, answers, possibleAnswers) {
  return possibleAnswers.answerOptions.some(sol => {
    // Make sure all the answers after the current answer are null if finalQuestion field is set
    if (sol.answer === answer && sol.finalQuestion) {
      return answers.slice(index + 1).every(ans => ans === null)
    }
    // Make sure all the answers after the current answer till skipTo index are null if skipTo field is set
    if (sol.answer === answer && sol.skipTo) {
      return answers.slice(index + 1, sol.skipTo - 1).every(ans => ans === null)
    }

    return sol.answer === answer
  })
}

module.exports = function (app) {
  return function (context) {
    const userQuestionnaire = app.service('user-questionnaire').get(context.id)
    return userQuestionnaire
    .then(data => app.service('questions').find({ query: { questionnaireId: data.questionnaireId, $sort: { sortIndex: 1 } } }))
    .then(result => {
      const answers = context.data.answers
      // Validate the length of the array (size === questionnaire numbers)
      if (answers.length !== result.total) {
        return Promise.reject(new errors.BadRequest('Number of answers do not match the number of questions!'))
      }

      // Validate if each answer in the array is an actual answer from the questionnaire
      const areAnswers = result.data.every((solution, index) => {
        const answer = answers[index]
        if (answer !== null) {
          if (solution.questionType === 'SINGLE' || solution.questionType === 'DROPDOWN') {
            return validateAnswer(index, answer, answers, solution)
          } else {
            return Array.isArray(answer) &&
            answer.length > 0 &&
            answer.length <= solution.answerOptions.length &&
            answer.every((multiAnswer) => validateAnswer(index, multiAnswer, answers, solution))
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
