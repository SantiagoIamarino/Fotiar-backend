const db = require('../db')

beforeAll(async () => await db.connect())
afterEach(async () => await db.clearDB())
afterAll(async () => await db.disconnect())

describe('when user select cashier method', () => {

  it('works', () => {
    let foo = 1
    expect(foo).toBe(2)
  })

})