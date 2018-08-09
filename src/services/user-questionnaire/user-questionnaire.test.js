const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')
const userUtils = utils.users
const { transactions } = require('../../../test-utils/index')

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

const validAnswers = [
  skel.questions[0].answerOptions[1].answer,
  skel.questions[1].answerOptions[1].answer,
  [skel.questions[2].answerOptions[1].answer]
]

const address = 'mkZQx5aLbtDwyEctWhPwk5BhbNfcLLXsaG'

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('user-questionnaire')
  const questionnaireService = app.service('questionnaires')
  const questionsService = app.service('questions')

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
      questionnaireService.create(skel.questionnaire)
        .then(questionnaire => {
          this.questionnaire = questionnaire
          return Promise.all(skel.questions.map(q =>
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
      Promise.all([questionnaireService.remove(this.questionnaire._id.toString()), questionsService.remove(null, {})])
      .then(() => done())
    })

    it("Can't set the status to completed when not all questions are completed", (done) => {
      create([
        skel.questions[0].answerOptions[1].answer,
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
        skel.questions[0].answerOptions[1].answer,
        skel.questions[1].answerOptions[1].answer,
        [skel.questions[2].answerOptions[1].answer]
      ])
      .then(userQuestionnaire => {
        assert.equal(userQuestionnaire.status, 'COMPLETED')
        done()
      })
      .catch(done)
    })

    it('Will not create two user questionnaires of the same questionnaire and user', (done) => {
      Promise.all([create(validAnswers, address), create(validAnswers, address)])
      .then(() => done('Should not create user questionnaire record twice!'))
      .catch(err => {
        try {
          assert.equal(err.name, 'Conflict', 'Conflict error')
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

      it('Will send reward after first completion', (done) => {
        create(validAnswers, address)
        .then(userQuestionnaire => {
          assert.equal(userQuestionnaire.status, 'REWARDED', 'user has been rewarded')
          done()
        })
        .catch(done)
      })

      it('Will send only one reward after multiple parallel requests', (done) => {
        Promise.all([
          create(validAnswers, address),
          create(validAnswers, address),
          create(validAnswers, address),
          create(validAnswers, address)
        ])
        .then(() => {
          const requests = transactions.history().post.filter(req => req.data.indexOf('"method":"sendrawtransaction"') > -1)
          assert.equal(requests.length, 1, 'sendrawtransaction was called exactly once')
          done()
        })
        .catch(done)
      })
    })
  })
}
