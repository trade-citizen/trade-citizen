//
// https://firebase.google.com/docs/functions/unit-testing
// https://github.com/firebase/functions-samples/blob/master/quickstarts/uppercase/functions/test/test.js
//
'use strict'
const chai = require('chai')
const assert = chai.assert
const chaiAsPromised = require("chai-as-promised")
chai.use(chaiAsPromised)
const sinon = require('sinon')

describe('Cloud Functions', () => {
  // [START stubConfig]
  var myFunctions, configStub, adminInitStub, functions, admin

  before(() => {
    admin =  require('firebase-admin')
    adminInitStub = sinon.stub(admin, 'initializeApp')
    functions = require('firebase-functions')
    configStub = sinon.stub(functions, 'config').returns({
        firebase: {
          databaseURL: 'https://not-a-project.firebaseio.com',
          storageBucket: 'not-a-project.appspot.com'
        }
      })
    myFunctions = require('../index')
  })

  after(() => {
    configStub.restore()
    adminInitStub.restore()
  })
  // [END stubConfig]

  describe('hello', () => {
    it('should respond 200 world', (done) => {
      const req = {}
      const res = {
        send: (value) => {
          assert.equal(value, 'world')
          done()
        }
      }
      myFunctions.hello(req, res)
    })
  })
})
