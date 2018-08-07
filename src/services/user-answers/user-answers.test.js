const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')

utils.clients.forEach(client => {
  runTests(client)
})

const skel = {
  questionnaire: {
    description: 'Test questionnaire',
    status: 'active',
    reward: 0.005
  },
  questions: [
    {
      question: 'What best describes your interest in Equibit?',
      questionType: 'SINGLE',
      sortIndex: 1,
      answerOptions: [
        {
          answer: 'I just want the free EQB for completing this questionnaire <strong>[end]</strong>',
          finalQuestion: true
        },
        { answer: 'I’m interested in both investing and raising money for companies on the blockchain' },
        { answer: 'I’m only interested in using Equibit Portfolio to invest in companies' },
        {
          answer: 'I’m only interested in using Equibit Portfolio to raise money for companies <strong>[Goto Q8]</strong>',
          skipTo: 3
        }
      ]
    },
    {
      question: 'How likely are you to use Equibit Portfolio to invest in a company?',
      questionType: 'SINGLE',
      sortIndex: 2,
      answerOptions: [
        {
          answer: 'Unlikely <strong>[end]</strong>',
          finalQuestion: true
        },
        { answer: 'Somewhat likely' },
        { answer: 'Very likely' },
        { answer: 'Don’t know' }
      ]
    },
    {
      question: 'What types of companies are you most interested investing in?',
      questionType: 'MULTI',
      sortIndex: 3,
      answerOptions: [
        {
          answer: 'Blockchain',
          finalQuestion: true
        },
        { answer: 'Fintech' },
        { answer: 'Cannabis' },
        { answer: 'Any Start-up' },
        { answer: 'Traditional/Blue chip' },
        { answer: 'Any' },
        { answer: "Don't know" }
      ]
    }]
}

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const userAnswersService = app.service('user-answers')
  const questionnaireService = app.service('questionnaires')
  const questionsService = app.service('questions')

  const invalidCreate = (invalidAnswers, done) => {
    return userAnswersService.create({questionnaireId: this.questionnaire._id, answers: invalidAnswers})
    .then(() => done('Should not accept invalid answers'))
    .catch(err => {
      try {
        assert.equal(err.message, 'Completed answer array is invalid!', err.message)
        done()
      } catch (err) {
        done(err)
      }
    })
  }

  const validCreate = (validAnswers, done) => {
    return userAnswersService.create({questionnaireId: this.questionnaire._id, answers: validAnswers})
    .catch(done)
  }

  describe(`User Answers Tests - ${transport}`, () => {
    before((done) => {
      // Initialize questionnaire and questions
      questionnaireService.create(skel.questionnaire)
        .then(questionnaire => {
          this.questionnaire = questionnaire
          return Promise.all(skel.questions.map(q =>
            questionsService.create(Object.assign({}, q, { questionnaireId: questionnaire._id }))))
        })
        .then(() => done())
    })

    after((done) => {
      Promise.all([questionnaireService.remove(this.questionnaire._id.toString()),
        questionsService.remove(null, {})
      ])
      .then(() => done())
    })

    describe('Create method ', () => {
      describe('Invalid answers ', () => {
        it('Should not accept answers that are not valid', (done) => {
          const invalidAnswers = [
            skel.questions[0].answerOptions[1].answer,
            'invalidanswer',
            [skel.questions[2].answerOptions[1].answer, skel.questions[2].answerOptions[2].answer]
          ]
          invalidCreate(invalidAnswers, done)
        })

        it('Should not accept invalid answers in multi question array', function (done) {
          const invalidAnswers = [
            skel.questions[0].answerOptions[1].answer,
            skel.questions[1].answerOptions[1].answer,
            [skel.questions[2].answerOptions[1].answer, 'invalidanswer', 'invalidanswer']
          ]
          invalidCreate(invalidAnswers, done)
        })

        it('Should not accept a string for a multi question', function (done) {
          const invalidAnswers = [
            skel.questions[0].answerOptions[1].answer,
            skel.questions[1].answerOptions[1].answer,
            'invalidanswer'
          ]
          invalidCreate(invalidAnswers, done)
        })

        it('Should not accept more answers than are required for a multi question', function (done) {
          const invalidAnswers = [
            skel.questions[0].answerOptions[1].answer,
            skel.questions[1].answerOptions[1].answer,
            [skel.questions[2].answerOptions[1].answer, 'invalidanswer', 'invalidanswer', 'invalidanswer']
          ]
          invalidCreate(invalidAnswers, done)
        })

        it('Should not accept answers between skipTo indexes', (done) => {
          const invalidAnswers = [
            skel.questions[0].answerOptions[3].answer,
            skel.questions[1].answerOptions[1].answer,
            [skel.questions[2].answerOptions[1].answer]
          ]
          invalidCreate(invalidAnswers, done)
        })

        it('Should not accept answers set after finalQuestion', (done) => {
          const invalidAnswers = [
            skel.questions[0].answerOptions[0].answer,
            skel.questions[1].answerOptions[1].answer,
            [skel.questions[2].answerOptions[1].answer]
          ]
          invalidCreate(invalidAnswers, done)
        })
      })

      describe('Valid answers', () => {
        it('Should accept answers that are null in between skipTo indexes', (done) => {
          const validAnswers = [
            skel.questions[0].answerOptions[3].answer,
            null,
            [skel.questions[2].answerOptions[1].answer]
          ]
          validCreate(validAnswers)
            .then(userAnswers => {
              assert.equal(userAnswers.answers.length, 3)
              assert.equal(userAnswers.answers[0], validAnswers[0])
              assert.equal(userAnswers.answers[1], validAnswers[1])
              assert.ok(Array.isArray(userAnswers.answers[2]))
              assert.equal(userAnswers.answers[2][0], validAnswers[2][0])
              done()
            })
            .catch(done)
        })

        it('Should accept answers that are null after finalQuestion', (done) => {
          const validAnswers = [
            skel.questions[0].answerOptions[0].answer,
            null,
            null
          ]
          validCreate(validAnswers)
          .then(userAnswers => {
            assert.equal(userAnswers.answers.length, 3)
            assert.equal(userAnswers.answers[0], validAnswers[0])
            assert.equal(userAnswers.answers[1], validAnswers[1])
            assert.equal(userAnswers.answers[2], validAnswers[2])
            done()
          })
          .catch(done)
        })
      })
    })
  })
}
