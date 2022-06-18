const supertest = require('supertest');
const assert = require('assert');
const { app, server } = require('../../app');
const db = require('../db');

const api = supertest(app)

beforeAll(async () => await db.connect())
afterEach(async () => await db.clearDB())
afterAll(async () => {
  await db.disconnect()
  server.close()
})

describe('when user selects mp method', () => {

  it('generates order correctly', async () => {
    await api
      .get('/images/testing')
      .expect(201)
      .expect('Content-Type', /application\/json/)
  })

  it('retrieves QR data', () => {
    let foo = 1
    expect(foo).toBe(1)
  })

})

describe('when user select cashier method', () => {


})