import { app } from "../src/config/expressConfig"
import refreshTokenRepository from "../src/model/redis/refreshTokenRepository"
import tokenRepository from "../src/model/redis/tokenRepository"
import { clearDeletedBookings, closeServer, createBooking, deleteSessionInRedis, getExistingBooking, getField, login, restoreBookings } from "./test-utils"
import supertest from "supertest"

afterAll(async () => {
  await closeServer()
})

describe('POST /api/booking', () => {
  let accessToken
  let accessTokenId
  let refreshTokenId

  let validationScenarios = [
    [
      {
        field_id: '680bb4be8196da834ffcebca',
        payment_type: 'ONLINE'
      },
      400
    ],
    [
      {
        field_id: '680bb4be8196da834ffcebca',
        schedule: 238,
        payment_type: 'ONLINE'
      },
      400
    ],
    [
      {
        field_id: '680bb4be8196da834ffcebca',
        schedule: 'abc',
        payment_type: 'POA'
      },
      400
    ],
    [
      {
        field_id: '680bb4be8196da834ffcebca',
        schedule: 'abc',
        payment_type: 'cod'
      },
      400
    ],
    [
      {
        field_id: '680bb4ba',
        schedule: 1747447200000,
        payment_type: 'ONLINE'
      },
      400
    ],
  ]
  let fieldId
  (async () => {
    const fields = await getField()
    fieldId = fields[0]._id.toString()
  })()

  beforeAll(async () => {
    const result = await login()
    accessToken = result.accessToken
    accessTokenId = result.accessTokenId
    refreshTokenId = result.refreshTokenId
  })

  afterAll(async () => {
    await deleteSessionInRedis(accessTokenId, refreshTokenId)
  })

  afterEach(async () => {
    await restoreBookings()
  })

  it.each(validationScenarios)('should return validation error', async (payload, expectedStatus) => {
    const result = await supertest(app) 
      .post('/api/bookings')
      .set('authorization', 'Bearer ' + accessToken)
      .set('content-type', 'application/json')
      .send(payload)
    expect(result.status).toBe(expectedStatus)
  })

  it('should return field not found error', async () => {
    let tomorowSchdule = new Date()
    tomorowSchdule.setHours(14, 0, 0, 0)
    tomorowSchdule = tomorowSchdule.getTime() + 86400000
    const result = await supertest(app) 
      .post('/api/bookings')
      .set('authorization', 'Bearer ' + accessToken)
      .set('content-type', 'application/json')
      .send({
        field_id: '680bb4be8196da834ffceba',
        schedule: tomorowSchdule,
        payment_type: 'POA'
      })
    expect(result.status).toBe(404)
  })

  it('should return schedule already exists error', async () => {
    const booking = await getExistingBooking(fieldId)
    const existingSchedule = booking.schedule
    const result = await supertest(app) 
      .post('/api/bookings')
      .set('authorization', 'Bearer ' + accessToken)
      .set('content-type', 'application/json')
      .send({
        field_id: fieldId,
        schedule: existingSchedule,
        payment_type: 'POA'
      })    
    expect(result.status).toBe(409)
  })

  it('should return success with payment POA', async () => {
    let tomorowSchdule = new Date()
    tomorowSchdule.setHours(14, 0, 0, 0)
    tomorowSchdule = tomorowSchdule.getTime() + 86400000
    const result = await supertest(app) 
      .post('/api/bookings')
      .set('authorization', 'Bearer ' + accessToken)
      .set('content-type', 'application/json')
      .send({
        field_id: fieldId,
        schedule: tomorowSchdule,
        payment_type: 'POA'
      })
    expect(result.status).toBe(200)
    expect(result.body.data.booking_id).toBeDefined()
  })

  it('should return success with payment ONLINE', async () => {
    let tomorowSchdule = new Date()
    tomorowSchdule.setHours(14, 0, 0, 0)
    tomorowSchdule = tomorowSchdule.getTime() + 86400000
    const result = await supertest(app) 
      .post('/api/bookings')
      .set('authorization', 'Bearer ' + accessToken)
      .set('content-type', 'application/json')
      .send({
        field_id: fieldId,
        schedule: tomorowSchdule,
        payment_type: 'ONLINE'
      })    
    expect(result.status).toBe(200)
    expect(result.body.data.booking_id).toBeDefined()
    expect(result.body.data.payment_token).toBeDefined()
  })
})

describe('GET /api/bookings', () => {
  let accessToken
  let accessTokenId
  let refreshTokenId

  const validationScenarios = [
    [
      {
        limit: 5,
        status: 'pending'
      },
      400
    ],
    [
      {
        page: 1,
        limit: 'abc',
        status: 'pending'
        
      },
      400
    ],
    [
      {
        page: 1,
        limit: 5,
        status: 'udah'
      },
      400
    ],
    [
      {
        page: 1,
        limit: 5,
        status: 'selesai',
        create_order: 'baru',
        field_id: '680cc523e82daeb66de0167b'
      },
      400
    ],
    [
      {
        page: 1,
        limit: 5,
        status: 'selesai',
        create_order: 'desc',
        field_id: '680cc523e82dae'
      },
      400
    ],
  ]

  beforeAll(async () => {
    const result = await login()
    accessToken = result.accessToken
    accessTokenId = result.accessTokenId
    refreshTokenId = result.refreshTokenId
  })

  afterAll(async () => {
    await deleteSessionInRedis(accessTokenId, refreshTokenId)
  })

  it.each(validationScenarios)('should return validation error', async (payload, expectedStatus) => {
    const result = await supertest(app)
      .get('/api/bookings')
      .set('authorization', 'Bearer ' + accessToken)
      .query(payload)
    expect(result.status).toBe(expectedStatus)
  })

  it('should return success', async () => {
    const result = await supertest(app)
    .get('/api/bookings')
    .set('authorization', 'Bearer ' + accessToken)
    .query({
      page: 1,
      limit: 5
    })
    expect(result.status).toBe(200)
    expect(result.body.data.page).toBeDefined()
    expect(result.body.data.limit).toBeDefined()
    for(const booking of result.body.data.bookings) {
      expect(booking.id).toBeDefined()
      expect(booking.field).toBeDefined()
      expect(booking.schedule).toBeDefined()
      expect(booking.status).toBeDefined()
    }
  })

})

describe('GET /api/bookings/:id', () => {
  let accessToken
  let accessTokenId
  let refreshTokenId

  beforeAll(async () => {
    const result = await login()
    accessToken = result.accessToken
    accessTokenId = result.accessTokenId
    refreshTokenId = result.refreshTokenId
  })

  afterAll(async () => {
    await deleteSessionInRedis(accessTokenId, refreshTokenId)
  })

  it('should return validation error', async () => {
    const result = await supertest(app)
      .get('/api/bookings/123')
      .set('authorization', 'Bearer ' + accessToken)
    expect(result.status).toBe(400)
  })
  
  it('should return booking not found error', async () => {
    const result = await supertest(app)
      .get('/api/bookings/680cc524e62dacb66de01683')
      .set('authorization', 'Bearer ' + accessToken)
    expect(result.status).toBe(404)
  })
  
  it('should return success', async () => {
    const bookingId = (await getExistingBooking())._id.toString()
    const result = await supertest(app)
      .get('/api/bookings/' + bookingId)
      .set('authorization', 'Bearer ' + accessToken)
    expect(result.status).toBe(200)
    const data = result.body.data
    expect(data.id).toBeDefined()
    expect(data.status).toBeDefined()
    expect(data.created_date).toBeDefined()
    expect(data.schedule).toBeDefined()
    expect(data.payment_type).toBeDefined()
    expect(data.total).toBeDefined()
    expect(data.field).toBeDefined()
    expect(data.field.id).toBeDefined()
    expect(data.field.name).toBeDefined()
    expect(data.field.location).toBeDefined()
    expect(data.field.img).toBeDefined()
    expect(data.field.cost).toBeDefined()
  })
})

describe('DELETE /api/bookings/:id', () => {
  let accessToken
  let accessTokenId
  let refreshTokenId

  beforeAll(async () => {
    const result = await login()
    accessToken = result.accessToken
    accessTokenId = result.accessTokenId
    refreshTokenId = result.refreshTokenId
  })

  afterAll(async () => {
    await deleteSessionInRedis(accessTokenId, refreshTokenId)
    await clearDeletedBookings()
  })

  it('should return validation error', async () => {
    const result = await supertest(app)
      .delete('/api/bookings/123')
      .set('authorization', 'Bearer ' + accessToken)
    expect(result.status).toBe(400)
  })

  it('should return booking not found error', async () => {
    const result = await supertest(app)
      .delete('/api/bookings/680cc524e62dacb66de01683')
      .set('authorization', 'Bearer ' + accessToken)
    expect(result.status).toBe(404)
  })

  it('should return success', async () => {
    const createdBookingId = await createBooking() 
    const result = await supertest(app)
      .delete('/api/bookings/' + createdBookingId)
      .set('authorization', 'Bearer ' + accessToken)
    expect(result.status).toBe(200)
  })
})
