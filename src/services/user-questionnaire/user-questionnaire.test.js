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

  const address = 'mkZQx5aLbtDwyEctWhPwk5BhbNfcLLXsaG'

  const create = (answers, address) => {
    return serviceOnClient.create({
      questionnaireId: this.questionnaire._id,
      answers,
      address
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

    it('Can set the status to completed when the final answer array is valid without address', (done) => {
      create([
        questions[0].answerOptions[1].answer,
        questions[1].answerOptions[1].answer,
        [questions[2].answerOptions[1].answer]
      ])
      .then(userQuestionnaire => {
        assert.equal(userQuestionnaire.status, 'COMPLETED')
        done()
      })
      .catch(done)
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

      it('Will send reward after first completion', (done) => {
        create(validAnswers, address)
        .then(userQuestionnaire => {
          assert.equal(userQuestionnaire.status, 'REWARDED', 'user has been rewarded')
          done()
        })
        .catch(done)
      })

      it('Will not show address in record if reward goes through', (done) => {
        create(validAnswers, address)
        .then(userQuestionnaire => {
          assert.equal(userQuestionnaire.address, null, 'address is set to null')
          done()
        })
        .catch(done)
      })

      it('Will send only one reward after multiple parallel requests', (done) => {
        Promise.all([create(validAnswers, address), create(validAnswers, address)])
        .catch(err => {
          try {
            const requests = transactions.history().post.filter(req => req.data.indexOf('"method":"sendrawtransaction"') > -1)
            assert.equal(err.name, 'Conflict', 'Conflict error')
            assert.ok(requests.length <= 1, 'sendrawtransaction was called once or none')
            done()
          } catch (assertionErr) {
            done(assertionErr)
          }
        })
      })
    })
  })
}
