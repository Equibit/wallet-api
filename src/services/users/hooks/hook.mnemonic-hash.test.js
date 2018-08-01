const assert = require('assert')
const mnemonicHash = require('./hook.mnemonic-hash')

describe('Users Service Tests - hook mnemonicHash', () => {
  let hookBefore

  beforeEach(() => {
    hookBefore = {
      type: 'before',
      method: 'patch',
      params: {provider: 'rest'},
      data: {},
      user: {}
    }
  })

  it('allows to set mnemonicHash along with encrypted props', async () => {
    hookBefore.data = {
      mnemonicHash: 'abcdef',
      encryptedMnemonic: '123',
      encryptedKey: '456'
    }
    hookBefore = await mnemonicHash()(hookBefore)

    assert.equal(hookBefore.data.mnemonicHash, 'abcdef')
  })

  it('allows to verify mnemonicHash', async () => {
    hookBefore.user = {mnemonicHash: 'abcdef'}
    hookBefore.data = {mnemonicHash: 'abcdef'}
    hookBefore = await mnemonicHash()(hookBefore)

    assert.equal(hookBefore.result.status, 0)
    assert.equal(hookBefore.result.message, 'Mnemonic was verified')
  })

  it('does not verify a wrong mnemonic', async () => {
    hookBefore.user = {mnemonicHash: 'abcdef'}
    hookBefore.data = {mnemonicHash: '123'}
    hookBefore = await mnemonicHash()(hookBefore)

    assert.equal(hookBefore.result.status, 1)
    assert.equal(hookBefore.result.message, 'Mnemonic verification failed')
  })

  it('throws on mnemonicHash w/o encrypted props when mnemoncHash is not in DB', () => {
    hookBefore.user = {}
    hookBefore.data = {mnemonicHash: 'abcdef'}

    return mnemonicHash()(hookBefore)
      .then(() => {
        console.log()
        assert.ok(false, 'Should throw an error instead')
      })
      .catch(err => {
        assert.equal(err.name, 'BadRequest')
        assert.equal(err.message, 'You cannot update mnemonic hash!')
      })

    // todo: replace the above with `assert.rejects` when we get node v10.
    // assert.throws(async () => {
    //   await mnemonicHash()(hookBefore)
    // }, {message: 'You cannot update mnemonic hash!'}) //,
  })
})
