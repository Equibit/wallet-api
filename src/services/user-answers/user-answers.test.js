const assert = require('assert')
const app = require('../../app')
const utils = require('../../../test-utils/index')
const userUtils = utils.users

utils.clients.forEach(client => {
  runTests(client)
})

const skel = {
  userQuestionaire: {
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
      sortIndex: '1',
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
      sortIndex: '3',
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
  const userQuestionaireService = app.service('user-questionaire')
  const serviceOnClient = feathersClient.service('user-answers')
  const questionaireService = app.service('questionaires')
  const questionsService = app.service('questions')

  const validCreate = () => {
    return serviceOnClient.create({
      userQuestionaireId: this.userQuestionaire._id.toString(),
      answers: [
        skel.questions[0].answerOptions[0],
        skel.questions[1].answerOptions[0],
      [skel.questions[2].answerOptions[0]]
      ]
    })
  }

  const invalidCheck = (invalidAnswers, done) => {
    return serviceOnClient.create({
      userQuestionaireId: this.userQuestionaire._id.toString(),
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
    return validCreate()
      .then(userAnswers => {
        return serviceOnClient.patch(userAnswers._id.toString(), {answers: invalidAnswers})
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

  describe(`User Answers Tests - ${transport}`, () => {
    before((done) => {
      // Initialize questionaire and questions
      questionaireService.create(skel.questionaire)
        .then(questionaire => {
          this.questionaire = questionaire
          return Promise.all(skel.questions.map(q =>
            questionsService.create(Object.assign({}, q, { questionaireId: questionaire._id.toString() }))))
        })
        .then(() => done())
    })

    beforeEach((done) => {
      userUtils.create(app).then(user => {
        this.user = user
        return userUtils.authenticateTemp(app, feathersClient, this.user)
      })
      .then(() => {
        const userQuestionaire = Object.assign({}, skel.userQuestionaire, {
          questionaireId: this.questionaire._id.toString(),
          userId: this.user._id.toString()
        })
        return userQuestionaireService.create(userQuestionaire)
      })
      .then((userQuestionaire) => {
        this.userQuestionaire = userQuestionaire
        done()
      })
    })

    afterEach((done) => {
      feathersClient.logout()
        .then(() => userQuestionaireService.remove(null, { query: { userId: this.user._id.toString() } }))
        .then(result => app.service('user-answers').remove(null, { query: { userQuestionaireId: result[0]._id.toString() } }))
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
      Promise.all([questionaireService.remove(this.questionaire._id.toString()),
        questionsService.remove(null, {})
      ])
      .then(() => done())
    })

    describe('Create method ', () => {
      describe('Invalid answers ', () => {
        it('Should not accept answers that are not valid', (done) => {
          const invalidAnswers = [
            skel.questions[0].answerOptions[0],
            'invalid answer',
            [skel.questions[2].answerOptions[0], skel.questions[2].answerOptions[1]]
          ]
          invalidCheck(invalidAnswers, done)
        })

        it('Should not accept invalid answers in multi question array', function (done) {
          const invalidAnswers = [
            skel.questions[0].answerOptions[0],
            skel.questions[1].answerOptions[0],
            [skel.questions[2].answerOptions[0], 'invalid answer', 'invalid answer']
          ]
          invalidCheck(invalidAnswers, done)
        })

        it('Should not accept a string for a multi question', function (done) {
          const invalidAnswers = [
            skel.questions[0].answerOptions[0],
            skel.questions[1].answerOptions[0],
            'invalid answer'
          ]
          invalidCheck(invalidAnswers, done)
        })

        it('Should not accept more answers then are required for a multi question', function (done) {
          const invalidAnswers = [
            skel.questions[0].answerOptions[0],
            skel.questions[1].answerOptions[0],
            [skel.questions[2].answerOptions[0], 'invalid answer', 'invalid answer', 'invalid answer']
          ]
          invalidCheck(invalidAnswers, done)
        })
      })

      describe('Valid answers', () => {
        it('Should accept answers that are null', (done) => {
          serviceOnClient.create({
            userQuestionaireId: this.userQuestionaire._id.toString(),
            answers: [null, null, null]
          })
          .then(userAnswers => {
            assert.equal(userAnswers.answers.length, 3)
            assert.ok(userAnswers.answers.every(answer => answer === null))
            done()
          })
        })
      })
    })

    describe('Patch method ', () => {
      describe('Invalid answers ', () => {
        it('Should not accept answers that are not valid', (done) => {
          const invalidAnswers = [
            skel.questions[0].answerOptions[0],
            'invalid answer',
              [skel.questions[2].answerOptions[0], skel.questions[2].answerOptions[1]]
          ]
          invalidPatch(invalidAnswers, done)
        })

        it('Should not accept invalid answers in multi question array', function (done) {
          const invalidAnswers = [
            skel.questions[0].answerOptions[0],
            skel.questions[1].answerOptions[0],
              [skel.questions[2].answerOptions[0], 'invalid answer', 'invalid answer']
          ]
          invalidPatch(invalidAnswers, done)
        })

        it('Should not accept a string for a multi question', function (done) {
          const invalidAnswers = [
            skel.questions[0].answerOptions[0],
            skel.questions[1].answerOptions[0],
            'invalid answer'
          ]
          invalidPatch(invalidAnswers, done)
        })

        it('Should not accept more answers then are required for a multi question', function (done) {
          const invalidAnswers = [
            skel.questions[0].answerOptions[0],
            skel.questions[1].answerOptions[0],
              [skel.questions[2].answerOptions[0], 'invalid answer', 'invalid answer', 'invalid answer']
          ]
          invalidPatch(invalidAnswers, done)
        })
      })

      describe('Valid answers', () => {
        it('Should accept answers that are null', (done) => {
          validCreate()
            .then(userAnswers => {
              return serviceOnClient.patch(userAnswers._id, {answers: [null, null, null]})
            })
            .then(userAnswers => {
              assert.equal(userAnswers.answers.length, 3)
              assert.ok(userAnswers.answers.every(answer => answer === null))
              done()
            })
        })
      })

      describe('userQuestionaireId, ', () => {
        it('Should not modify userQuestionaireId field ', (done) => {
          validCreate()
            .then(userAnswers => {
              return serviceOnClient.patch(userAnswers._id.toString(), {userQuestionaireId: 'abc'})
            })
            .then(() => done('Should not patch userQuestionaireId'))
            .catch(err => {
              try {
                assert.equal(err.message, 'Field userQuestionaireId may not be patched. (preventChanges)', err.message)
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
