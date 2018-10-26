const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')
const userUtils = utils.users
const { transactions } = require('../../../test-utils/index')
const questionnaireSkel = require('../../../test-utils/questionnaire')

utils.clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('user-questionnaire')
  const questionnaireService = app.service('questionnaires')
  const questionsService = app.service('questions')
  const questions = questionnaireSkel.questions

  const validAnswers = [
    questions[0].answerOptions[1].answer,
    questions[1].answerOptions[1].answer,
    [questions[2].answerOptions[1].answer]
  ]

  const create = (answers) => {
    return serviceOnClient.create({
      questionnaireId: this.questionnaire._id,
      answers,
      address: 'mkZQx5aLbtDwyEctWhPwk5BhbNfcLLXsaG'
    })
  }

  describe(`User Questionnaire Tests - ${transport}`, () => {
    before((done) => {
      // Initialize questionnaire and questions
      questionnaireService.create(questionnaireSkel.questionnaire)
        .then(questionnaire => {
          this.questionnaire = questionnaire
          return Promise.all(questions.map(q =>
            questionsService.create(Object.assign({}, q, { questionnaireId: questionnaire._id }))))
        })
        .then(() => done())
    })

    beforeEach((done) => {
      userUtils.create(app).then(user => {
        this.user = user
        return userUtils.authenticateTemp(app, feathersClient, this.user)
      })
      .then(() => done())
    })

    afterEach((done) => {
      feathersClient.logout()
        .then(() => app.service('user-questionnaire').remove(null, { query: { userId: this.user._id.toString() } }))
        .then(() => userUtils.removeAll(app))
        .then(() => done())
    })

    after((done) => {
      Promise.all([
        questionnaireService.remove(this.questionnaire._id.toString()),
        questionsService.remove(null, {}),
        app.service('user-answers').remove(null, {})
      ])
      .then(() => done())
    })

    it("Can't set the status to completed when not all questions are completed", (done) => {
      create([
        questions[0].answerOptions[1].answer,
        null,
        null
      ])
      .then(() => done('Should not be completed'))
      .catch(err => {
        try {
          assert.equal(err.message, 'Completed answer array is invalid!', err.message)
          done()
        } catch (err) {
          done(err)
        }
      })
    })

    describe('Rewards tests', (done) => {
      beforeEach(() => {
        transactions.setupMock()
      })

      afterEach((done) => {
        transactions.resetMock()
        app.service('/transactions').remove(null)
        .then(() => done())
      })

      it.skip('Will throw error if reward amount is not : 0 < reward <= 0.5 EQB.', (done) => {
        // TODO: skip test until fake response from get questionnaire by ID is sent so that its response shows an invalid reward amount
        // mock with reward = 0, > 0.5 EQB
        create(validAnswers)
        .catch(error => {
          assert(error.message === 'Reward amount must be greater than 0 EQB and less than or equal to 0.5 EQB.', `the correct error was returned`)
          done()
        })
      })

      it('Will send reward after first completion', (done) => {
        create(validAnswers)
        .then(userQuestionnaire => {
          assert.equal(userQuestionnaire.status, 'REWARDED', 'user has been rewarded')
          done()
        })
        .catch(done)
      })

      it('Will not show address in record if reward goes through', (done) => {
        create(validAnswers)
        .then(userQuestionnaire => {
          assert.equal(userQuestionnaire.address, null, 'address is set to null')
          done()
        })
        .catch(done)
      })

      it('Will send only one reward after multiple parallel requests', (done) => {
        Promise.all([
          create(validAnswers).catch(() => 'ignore error'),
          create(validAnswers).catch(() => 'ignore error')])
        .then(() => {
          const requests = transactions.history().post.filter(req => req.data.indexOf('"method":"sendrawtransaction"') > -1)
          assert.ok(requests.length === 1, 'sendrawtransaction was called exactly once')
          done()
        })
        .catch(done)
      })
    })
  })
}
