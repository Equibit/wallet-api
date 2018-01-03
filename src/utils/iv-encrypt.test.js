const assert = require('assert')
const crypto = require('crypto')
const { encrypt, decrypt } = require('../utils/iv-encrypt')

const key = crypto.randomBytes(32)

describe('IV-Encrypt Util', function () {
  it('returns a different value given same inputs', function () {
    const text = 'test'
    const encryptedText1 = encrypt(text, key)
    const encryptedText2 = encrypt(text, key)
    assert(encryptedText1 !== encryptedText2, 'the values were unique')
  })

  it('encrypts & decrypts', function () {
    const text = 'test'
    const encryptedText1 = encrypt(text, key)
    const encryptedText2 = encrypt(text, key)
    const decryptedText1 = decrypt(encryptedText1, key)
    const decryptedText2 = decrypt(encryptedText2, key)

    assert(text !== encryptedText1, 'the encrypted value does not match the original')
    assert(encryptedText1 !== encryptedText2, 'unique values were returned')
    assert(text === decryptedText1, 'the text was successfully decrypted')
    assert(decryptedText1 === decryptedText2, 'the same value was decrypted')
  })
})
