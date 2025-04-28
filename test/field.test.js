import { app } from './../src/config/expressConfig.js'
import supertest from 'supertest'
import { closeServer, deleteSessionInRedis, getExistingBooking, getField, login, restoreReviews } from './test-utils.js'

afterAll(async () => {
  await closeServer()
})

describe('GET /api/fields', () => {
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
    accessToken = ''
  })

  it('should return success', async () => {
    const result = await supertest(app)
      .get('/api/fields')
      .set('authorization', 'Bearer ' + accessToken)
    expect(result.status).toBe(200)
    expect(result.body.data).toBeDefined()
    for(const field of result.body.data) {
      expect(field.id).toBeDefined()
      expect(field.name).toBeDefined()
      expect(field.rating).toBeDefined()
      expect(field.img).toBeDefined()
      expect(field.location).toBeDefined()
      expect(field.cost).toBeDefined()
    }
  })
})

describe('GET /api/fields/:id', () => {
  let accessToken
  let accessTokenId
  let refreshTokenId
  let fieldId

  beforeAll(async () => {
    const result = await login()
    accessToken = result.accessToken
    accessTokenId = result.accessTokenId
    refreshTokenId = result.refreshTokenId
    fieldId = (await getField())[0]._id.toString()
  })

  afterAll(async () => {
    await deleteSessionInRedis(accessTokenId, refreshTokenId)
    accessToken = ''
  })

  it('should return success', async () => {
    const result = await supertest(app)
      .get('/api/fields/' + fieldId)
      .set('authorization', 'Bearer ' + accessToken)
    expect(result.status).toBe(200)
    expect(result.body.data.id).toBeDefined()
    expect(result.body.data.name).toBeDefined()
    expect(result.body.data.cost).toBeDefined()
    expect(result.body.data.rating).toBeDefined()
    expect(result.body.data.images).toBeDefined()
    expect(result.body.data.location).toBeDefined()
    expect(result.body.data.floor_type).toBeDefined()
    expect(result.body.data.facilities).toBeDefined()
  })
})

describe('GET /api/fields/:id/schedules', () => {
  let accessToken
  let accessTokenId
  let refreshTokenId
  let fieldId

  const validationSchenarios = [
    [undefined, 400],
    ['ajie', 400],
  ]

  beforeAll(async () => {
    const result = await login()
    accessToken = result.accessToken
    accessTokenId = result.accessTokenId
    refreshTokenId = result.refreshTokenId
    fieldId = (await getField())[1]._id.toString()
  })

  afterAll(async () => {
    await deleteSessionInRedis(accessTokenId, refreshTokenId)
    accessToken = ''
  })

  it.each(validationSchenarios)('should return validation error', async (epochTime, expectedStatus) => {
    const result = await supertest(app)
      .get('/api/fields/' + fieldId + '/schedules')
      .set('authorization', 'Bearer ' + accessToken)
      .query({date: epochTime})
    expect(result.status).toBe(expectedStatus)
  })

  it('should return not found error', async () => {
    const result = await supertest(app)
      .get('/api/fields/' + fieldId + '/schedules')
      .set('authorization', 'Bearer ' + accessToken)
      .query({date: 1745479433105})
    expect(result.status).toBe(404)    
  })

  it('should return success', async () => {
    const booking = await getExistingBooking(fieldId)
    const result = await supertest(app)
      .get('/api/fields/' + fieldId + '/schedules')
      .set('authorization', 'Bearer ' + accessToken)
      .query({date: booking.schedule})
    expect(result.status).toBe(200)
    expect(result.body.data.date).toBeDefined()
    expect(typeof result.body.data.date).toBe('number')
    expect(result.body.data.schedules).toBeDefined()
    expect(result.body.data.schedules.length).toBeGreaterThanOrEqual(1)
    for(const schedule of result.body.data.schedules) {
      expect(schedule).toBeDefined()
      expect(typeof schedule).toBe('number')
    }
  })
})

describe('POST /api/fields/:id/review', () => {
  let accessToken
  let accessTokenId
  let refreshTokenId
  let fieldId

  const validationScenarios = [
    [
      {
        description: 'lorem ipsum dolor amet'
      },
      400
    ],
    [
      {
        description: 'lorem ipsum dolor amet',
        rating: 7
      },
      400
    ],
  ]

  beforeAll(async () => {
    const result = await login()
    accessToken = result.accessToken
    accessTokenId = result.accessTokenId
    refreshTokenId = result.refreshTokenId
    fieldId = (await getField())[0]._id.toString()
  })

  afterAll(async () => {
    await deleteSessionInRedis(accessTokenId, refreshTokenId)
    await restoreReviews()
    accessToken = ''
  })

  it.each(validationScenarios)('should return validation error', async (payload, expectedStatus) => {
   const result = await supertest(app)
      .post('/api/fields/' + fieldId + '/review')
      .set('authorization', 'Bearer ' + accessToken)
      .set('content-type', 'application/json')
      .send(payload) 
    expect(result.status).toBe(expectedStatus)
  })

  it('should return field not found error', async () => {
    const result = await supertest(app)
      .post('/api/fields/' + '6800f6c322f3by12eedo9ada' + '/review')
      .set('authorization', 'Bearer ' + accessToken)
      .set('content-type', 'application/json')
      .send({
        rating: 4,
        description: 'Bagus'
      })
    expect(result.status).toBe(404)
  })

  it('should return success', async () => {
    const result = await supertest(app)
      .post('/api/fields/' + fieldId + '/review')
      .set('authorization', 'Bearer ' + accessToken)
      .set('content-type', 'application/json')
      .send({
        rating: 4,
        description: 'oke bagus'
      }) 
    expect(result.status).toBe(200)
  })
})

describe('GET /api/fields/:id/review', () => {
  let accessToken
  let accessTokenId
  let refreshTokenId
  let fieldId

  beforeAll(async () => {
    const result = await login()
    accessToken = result.accessToken
    accessTokenId = result.accessTokenId
    refreshTokenId = result.refreshTokenId
    fieldId = (await getField())[0]._id.toString()
  })

  afterAll(async () => {
    await deleteSessionInRedis(accessTokenId, refreshTokenId)
    accessToken = ''
  })

  const validationScenarios = [
    [
      {
        page: 3
      },
      400
    ],
    [
      {
        page: 5,
        limit: 'uiw'
      },
      400
    ],
    [
      {
        page: 1,
        limit: 5,
        star: 9
      }, 
      400
    ]
  ]

  it.each(validationScenarios)('should return validation error', async (queries, expectedStatus) => {
    const result = await supertest(app)
      .get('/api/fields/' + fieldId + '/review')
      .set('authorization', 'Bearer ' + accessToken)
      .query(queries)
    expect(result.status).toBe(expectedStatus)
  })

  it('should return field not found error', async () => {
    const result = await supertest(app)
      .get('/api/fields/' + '6800f6c322f3by12eedo9ada' + '/review')
      .set('authorization', 'Bearer ' + accessToken)
      .query({
        page: 1,
        limit: 5
      })
    expect(result.status).toBe(404)
  })

  it('should return success', async () => {
    const result = await supertest(app)
      .get('/api/fields/' + fieldId + '/review')
      .set('authorization', 'Bearer ' + accessToken)
      .query({
        page: 1,
        limit: 5
      })
    expect(result.status).toBe(200)
    expect(result.body.data.page).toBeDefined()
    expect(result.body.data.limit).toBeDefined()
    expect(result.body.data.average_rating).toBeDefined()
    expect(result.body.data.total_reviews).toBeDefined()
    expect(result.body.data.reviews).toBeDefined()
    for(const review of result.body.data.reviews) {
      expect(review.id).toBeDefined()
      expect(review.user).toBeDefined()
      expect(review.rating).toBeDefined()
      expect(review.description).toBeDefined()
      expect(review.date_created).toBeDefined()
    }
  })
})