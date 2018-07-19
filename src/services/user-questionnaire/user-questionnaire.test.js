const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')
const userUtils = utils.users

utils.clients.forEach(client => {
  runTests(client)
})

const skel = {
  userQuestionnaire: {
    started: false,
    completed: false,
    rewarded: false
  },
  questionaire: {
    description: 'Test questionaire',
    status: 'active',
    reward: 0.005
  },
  questions: [
    {
      question: 'What best describes your interest in Equibit?',
      questionType: 'SINGLE',
      sortIndex: 1,
      answerOptions: [
        'I just want the free EQB for completing this questionnaire <strong>[end]</strong>',
        'I’m interested in both investing and raising money for companies on the blockchain',
        'I’m only interested in using Equibit Portfolio to invest in companies',
        'I’m only interested in using Equibit Portfolio to raise money for companies <strong>[Goto Q8]</strong>'
      ]
    },
    {
      question: 'How likely are you to use Equibit Portfolio to invest in a company?',
      questionType: 'SINGLE',
      sortIndex: 2,
      answerOptions: [
        'Unlikely <strong>[end]</strong>',
        'Somewhat likely',
        'Very likely',
        'Don’t know',
        'CUSTOM'
      ]
    },
    {
      question: 'What types of companies are you most interested investing in?',
      questionType: 'MULTI',
      sortIndex: 3,
      answerOptions: [
        'Blockchain',
        'Fintech',
        'Cannabis',
        'Any Start-up',
        'Traditional/Blue chip',
        'Any',
        'Don’t know'
      ]
    }]
}

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('user-questionnaire')
  const userAnswersService = app.service('user-answers')
  const questionaireService = app.service('questionaires')
  const questionsService = app.service('questions')

  describe(`User Questionaire Tests - ${transport}`, () => {
    before((done) => {
      // Initialize questionaire and questions
      questionaireService.create(skel.questionaire)
        .then(questionaire => {
          this.questionaire = questionaire
          return Promise.all(skel.questions.map(q =>
            questionsService.create(Object.assign({}, q, { questionaireId: questionaire._id }))))
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
          questionaireId: this.questionaire._id.toString(),
          userId: this.user._id.toString()
        })
        return serviceOnClient.create(userQuestionnaire)
      })
      .then(userQuestionnaire => {
        this.userQuestionnaire = userQuestionnaire
        done()
      })
    })

    afterEach((done) => {
      feathersClient.logout()
        .then(() => app.service('user-questionnaire').remove(null, { query: { userId: this.user._id.toString() } }))
        .then(() => userAnswersService.remove(null, { query: { userQuestionnaireId: this.userQuestionnaire._id.toString() } }))
        .then(() => userUtils.removeAll(app))
        .then(() => done())
    })

    after((done) => {
      Promise.all([questionaireService.remove(this.questionaire._id.toString()), questionsService.remove(null, {})])
      .then(() => done())
    })

    it("Can't change the questionaireId", (done) => {
      this.userQuestionnaire.questionaireId = 'ABC123'
      serviceOnClient.patch(this.userQuestionnaire._id, this.userQuestionnaire)
        .then(() => done('Should not be able to change questionaireId'))
        .catch(err => {
          try {
            assert.equal(err.message, 'Field questionaireId may not be patched. (preventChanges)', err.message)
            done()
          } catch (err) {
            done(err)
          }
        })
    })

    it("Can't change the completed field from true to false", (done) => {
      userAnswersService.create({
        userQuestionnaireId: this.userQuestionnaire._id.toString(),
        answers: [
          skel.questions[0].answerOptions[0],
          skel.questions[1].answerOptions[0],
          [skel.questions[2].answerOptions[0]]
        ]
      })
        .then(() => serviceOnClient.patch(this.userQuestionnaire._id.toString(), { completed: true }))
        .then(() => serviceOnClient.patch(this.userQuestionnaire._id.toString(), { completed: false }))
        .then(() => done('Should not be able to change completed field'))
        .catch(err => {
          try {
            assert.equal(err.message, "Can't change the completed status of a questionaire that is already completed!", err.message)
            done()
          } catch (err) {
            done(err)
          }
        })
    })

    it("Can't set completed field to true when not all questions are completed", (done) => {
      userAnswersService.create({
        userQuestionnaireId: this.userQuestionnaire._id.toString(),
        answers: [
          skel.questions[0].answerOptions[0],
          null,
          null
        ]
      })
      .then(() => serviceOnClient.patch(this.userQuestionnaire._id.toString(), { completed: true }))
      .then(() => done('Should not be able to change completed field to true!'))
      .catch(err => {
        try {
          assert.equal(err.message, 'Not all questions are answered!', err.message)
          done()
        } catch (err) {
          done(err)
        }
      })
    })
  })
}
