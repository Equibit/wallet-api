const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')
const userUtils = utils.users

utils.clients.forEach(client => {
  runTests(client)
})

const skel = {
  userQuestionnaire: {
    status: 'COMPLETED'
  },
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
  const userQuestionnaireService = app.service('user-questionnaire')
  const serviceOnClient = app.service('user-questionnaire')
  const questionnaireService = app.service('questionnaires')
  const questionsService = app.service('questions')

  const patch = (answers) => {
    return serviceOnClient.patch(this.userQuestionnaire._id, {
      userQuestionnaireId: this.userQuestionnaire._id.toString(),
      answers
      //   skel.questions[0].answerOptions[1].answer,
      //   skel.questions[1].answerOptions[1].answer,
      // [skel.questions[2].answerOptions[1].answer]
    })
  }

  const invalidCheck = (invalidAnswers, done) => {
    return serviceOnClient.patch(this.userQuestionnaire._id, {
      answers: invalidAnswers
    })
      .then(() => done('Should not accept invalid answers'))
      .catch(err => {
        try {
          assert.equal(err.message, 'Answer array is invalid!', err.message)
          done()
        } catch (err) {
          done(err)
        }
      })
  }

  const invalidPatch = (invalidAnswers, done) => {
    return serviceOnClient.patch(this.userQuestionnaire._id, {answers: invalidAnswers})
      .then(() => done('Should not accept invalid answers'))
      .catch(err => {
        try {
          assert.equal(err.message, 'Answer array is invalid!', err.message)
          done()
        } catch (err) {
          done(err)
        }
      })
  }

  describe(`User Answers Tests - ${transport}`, () => {
    before((done) => {
      // Initialize questionnaire and questions
      questionnaireService.create(skel.questionnaire)
        .then(questionnaire => {
          this.questionnaire = questionnaire
          return Promise.all(skel.questions.map(q =>
            questionsService.create(Object.assign({}, q, { questionnaireId: questionnaire._id.toString() }))))
        })
        .then(() => done())
    })

    beforeEach((done) => {
      userUtils.create(app).then(user => {
        this.user = user
        return userUtils.authenticateTemp(app, feathersClient, this.user)
      })
      .then(() => {
        const userQuestionnaire = Object.assign({}, skel.userQuestionnaire, {
          questionnaireId: this.questionnaire._id.toString(),
          userId: this.user._id.toString(),
          answers: [null, null, null]
        })
        return userQuestionnaireService.create(userQuestionnaire)
      })
      .then((userQuestionnaire) => {
        this.userQuestionnaire = userQuestionnaire
        done()
      })
    })

    afterEach((done) => {
      feathersClient.logout()
        .then(() => userQuestionnaireService.remove(null, { query: { userId: this.user._id } }))
        .then(() => userUtils.removeAll(app))
        .then(() => done())
        .catch(err => {
          try {
            console.log(err)
            done()
          } catch (err) {
            done(err)
          }
        })
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
          invalidCheck(invalidAnswers, done)
        })

        it('Should not accept invalid answers in multi question array', function (done) {
          const invalidAnswers = [
            skel.questions[0].answerOptions[1].answer,
            skel.questions[1].answerOptions[1].answer,
            [skel.questions[2].answerOptions[1].answer, 'invalidanswer', 'invalidanswer']
          ]
          invalidCheck(invalidAnswers, done)
        })

        it('Should not accept a string for a multi question', function (done) {
          const invalidAnswers = [
            skel.questions[0].answerOptions[1].answer,
            skel.questions[1].answerOptions[1].answer,
            'invalidanswer'
          ]
          invalidCheck(invalidAnswers, done)
        })

        it('Should not accept more answers than are required for a multi question', function (done) {
          const invalidAnswers = [
            skel.questions[0].answerOptions[1].answer,
            skel.questions[1].answerOptions[1].answer,
            [skel.questions[2].answerOptions[1].answer, 'invalidanswer', 'invalidanswer', 'invalidanswer']
          ]
          invalidCheck(invalidAnswers, done)
        })

        it('Should not accept answers between skipTo indexes', (done) => {
          const invalidAnswers = [
            skel.questions[0].answerOptions[3].answer,
            skel.questions[1].answerOptions[1].answer,
            [skel.questions[2].answerOptions[1].answer]
          ]
          invalidCheck(invalidAnswers, done)
        })

        it('Should not accept answers set after finalQuestion', (done) => {
          const invalidAnswers = [
            skel.questions[0].answerOptions[0].answer,
            skel.questions[1].answerOptions[1].answer,
            [skel.questions[2].answerOptions[1].answer]
          ]
          invalidCheck(invalidAnswers, done)
        })
      })

      describe('Valid answers', () => {
        it.only('Should accept answers that are null', (done) => {
          patch([null, null, null])
          .then(userAnswers => {
            assert.equal(userAnswers.answers.length, 3)
            assert.ok(userAnswers.answers.every(answer => answer === null))
            done()
          })
          .catch(done)
        })

        it.only('Should accept answers that are null in between skipTo indexes', (done) => {
          const validAnswers = [
            skel.questions[0].answerOptions[3].answer,
            null,
            [skel.questions[2].answerOptions[1].answer]
          ]
          patch(validAnswers)
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

        it.only('Should accept answers that are null after finalQuestion', (done) => {
          const validAnswers = [
            skel.questions[0].answerOptions[0].answer,
            null,
            null
          ]
          patch(validAnswers)
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

    describe('Patch method ', () => {
      describe('Invalid answers ', () => {
        it('Should not accept answers that are not valid', (done) => {
          const invalidAnswers = [
            skel.questions[0].answerOptions[1].answer,
            'invalidanswer',
              [skel.questions[2].answerOptions[1].answer, skel.questions[2].answerOptions[2].answer]
          ]
          invalidPatch(invalidAnswers, done)
        })

        it('Should not accept invalid answers in multi question array', function (done) {
          const invalidAnswers = [
            skel.questions[0].answerOptions[1].answer,
            skel.questions[1].answerOptions[1].answer,
              [skel.questions[2].answerOptions[1].answer, 'invalidanswer', 'invalidanswer']
          ]
          invalidPatch(invalidAnswers, done)
        })

        it('Should not accept a string for a multi question', function (done) {
          const invalidAnswers = [
            skel.questions[0].answerOptions[1].answer,
            skel.questions[1].answerOptions[1].answer,
            'invalidanswer'
          ]
          invalidPatch(invalidAnswers, done)
        })

        it('Should not accept more answers than are required for a multi question', function (done) {
          const invalidAnswers = [
            skel.questions[0].answerOptions[1].answer,
            skel.questions[1].answerOptions[1].answer,
              [skel.questions[2].answerOptions[1].answer, 'invalidanswer', 'invalidanswer', 'invalidanswer']
          ]
          invalidPatch(invalidAnswers, done)
        })

        it('Should not accept answers between skipTo indexes', (done) => {
          const invalidAnswers = [
            skel.questions[0].answerOptions[3].answer,
            skel.questions[1].answerOptions[1].answer,
            [skel.questions[2].answerOptions[1].answer]
          ]
          invalidPatch(invalidAnswers, done)
        })

        it('Should not accept answers set after finalQuestion', (done) => {
          const invalidAnswers = [
            skel.questions[0].answerOptions[0].answer,
            skel.questions[1].answerOptions[1].answer,
            [skel.questions[2].answerOptions[1].answer]
          ]
          invalidPatch(invalidAnswers, done)
        })
      })

      describe('Valid answers', () => {
        it('Should accept answers that are null', (done) => {
          patch([null, null, null])
            .then(userAnswers => {
              assert.equal(userAnswers.answers.length, 3)
              assert.ok(userAnswers.answers.every(answer => answer === null))
              done()
            })
            .catch(done)
        })
      })

      it('Should accept answers that are null in between skipTo indexes', (done) => {
        const validAnswers = [
          skel.questions[0].answerOptions[3].answer,
          null,
          [skel.questions[2].answerOptions[1].answer]
        ]

        patch(validAnswers)
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

        patch(validAnswers)
          .then(userAnswers => {
            assert.equal(userAnswers.answers.length, 3)
            assert.equal(userAnswers.answers[0], validAnswers[0])
            assert.equal(userAnswers.answers[1], validAnswers[1])
            assert.equal(userAnswers.answers[2], validAnswers[2])
            done()
          })
          .catch(done)
      })

      describe('userQuestionnaireId, ', () => {
        it('Should not modify userQuestionnaireId field ', (done) => {
          serviceOnClient.patch(this.userQuestionnaire._id, {userQuestionnaireId: 'abc'})
            .then(() => done('Should not patch userQuestionnaireId'))
            .catch(err => {
              try {
                assert.equal(err.message, 'Field userQuestionnaireId may not be patched. (preventChanges)', err.message)
                done()
              } catch (err) {
                done(err)
              }
            })
        })
      })
    })
  })
}
