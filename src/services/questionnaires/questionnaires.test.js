const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')
const { questions } = require('../../../test-utils/questionnaire')
const userUtils = utils.users

utils.clients.forEach(client => {
  runTests(client)
})

function runTests (feathersClient) {
  const transport = feathersClient.io ? 'feathers-socketio' : 'feathers-rest'
  const serviceOnClient = feathersClient.service('questionnaires')
  const questionnaireService = app.service('questionnaires')
  const questionsService = app.service('questions')

  describe(`Questionnaire Tests - ${transport}`, () => {
    before((done) => {
      userUtils.create(app).then(user => {
        this.user = user
        return userUtils.authenticateTemp(app, feathersClient, this.user)
      })
      .then(() => done())
    })

    afterEach((done) => {
      feathersClient.logout()
        .then(() => userUtils.removeAll(app))
        .then(() => done())
    })

    after((done) => {
      Promise.all([
        questionnaireService.remove(null, {}),
        questionsService.remove(null, {}),
        app.service('user-questionnaire').remove(null, {}),
        app.service('user-answers').remove(null, {})
      ])
      .then(() => done())
    })

    it('Only get the questionnaires that are not completed by the user', (done) => {
      Promise.all([
        questionnaireService.create({description: 'q1', status: 'active', reward: 0.005}),
        questionnaireService.create({description: 'q2', status: 'active', reward: 0.005}),
        questionnaireService.create({description: 'q3', status: 'active', reward: 0.005})
      ])
      .then(res => {
        this.q1 = res[0]._id
        this.q2 = res[1]._id
        this.q3 = res[2]._id
        return Promise.all(questions.map(q =>
          questionsService.create(Object.assign({}, q, { questionnaireId: this.q1 }))))
      })
      .then(() => feathersClient.service('user-questionnaire').create({
        questionnaireId: this.q1,
        answers: [
          questions[0].answerOptions[1].answer,
          questions[1].answerOptions[1].answer,
          [questions[2].answerOptions[1].answer]
        ]
      }))
      .then(() => serviceOnClient.find())
      .then(res => {
        const questionnaires = res.data
        assert.equal(questionnaires.length, 2, 'only two questionnaires left')
        assert.ok((questionnaires[0]._id === this.q2.toString() && questionnaires[1]._id === this.q3.toString()) ||
          (questionnaires[0]._id === this.q3.toString() && questionnaires[1]._id === this.q2.toString()),
          'the two questionnaires left are the ones not completed')
        done()
      })
      .catch(done)
    })
  })
}
