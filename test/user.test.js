import supertest from 'supertest'
import { app } from './../src/config/expressConfig.js'
import UserTemp from './../src/model/mongodb/userTempModel.js'
import { closeServer, createTempUser, deleteAllSessionInRedis, deleteSessionInRedis, login } from './test-utils.js'
import User from './../src/model/mongodb/userModel.js'
import EXISTING_USER from './../src/constant/user.js'

afterAll(async () => {
  await closeServer()
})

describe('POST /api/users/register', () => {
  const validationScenarios = [
    [
      {
        name: "Ramdhan",
        district: "Malangbong",
        sub_district: "Cisarua",
        email: "samsudin@gmail.com",
        password: "secre832jf92t",
      },
      400
    ],
    [
      {
        name: "Ramdhan",
        city: "Wado",
        district: "Malangbong",
        sub_district: "Cisarua",
        email: "dhanhoo.com",
        password: "secre832jf92t",
      },
      400
    ],
    [
      {
        name: "Ramdhan",
        city: "Wado",
        district: "Malangbong",
        sub_district: "Cisarua",
        email: "samsudin@gmail.com",
        password: "sect",
      },
      400
    ],
  ]

  afterAll(async () => {
    await UserTemp.deleteMany()
  })

  it.each(validationScenarios)('should return error validation', async (body, status) => {
    const result = await supertest(app)
      .post('/api/users/register')
      .set('content-type', 'application/json')
      .send(body)
    expect(result.status).toBe(status);
  })
  
  it('should return existing email error', async () => {
    const result = await supertest(app)
      .post('/api/users/register')
      .set('content-type', 'application/json')
      .send({
        name: "Ramdhan",
        city: "Wado",
        district: "Malangbong",
        sub_district: "Cisarua",
        email: EXISTING_USER.email,
        password: "secre832jf92t",
      })
    expect(result.status).toBe(409);
    expect(result.body.message).toBe('Email already exist')
  })

  it('should successfully register user', async () => {
    const result = await supertest(app)
      .post('/api/users/register')
      .set('content-type', 'application/json')
      .send({
        name: "Ramdhan",
        city: "Wado",
        district: "Malangbong",
        sub_district: "Cisarua",
        email: "dhan@yahoo.com",
        password: "secre832jf92t",
      })
    const userInTemp = await UserTemp.findOne({email: "dhan@yahoo.com"});
    expect(userInTemp).not.toBeNull();
    expect(result.status).toBe(201);
  }, 20000)
})

describe('POST /api/users/login', () => {
  const validationScenarios = [
    [
      {
        password: "se2t",
      },
      400
    ],
    [
      {
        email: "samsudiail.com",
        password: "se2tjfoiw238",
      },
      400
    ],
    [
      {
        email: "samsudin@gmail.com",
        password: "se",
      },
      400
    ],
  ]

  afterAll(async () => {
    await deleteAllSessionInRedis()
  })

  it.each(validationScenarios)('should return validation error', async (body, status) => {
    const result = await supertest(app)
      .post('/api/users/login')
      .set('content-type', 'application/json')
      .send(body)
    expect(result.status).toBe(status);
  })

  it('should return not found user error', async () => {
    const result = await supertest(app)
      .post('/api/users/login')
      .set('content-type', 'application/json')
      .send({
        email: "aduh@gmail.com",
        password: "apajalah983274",
      })
    expect(result.status).toBe(404);
  })

  it('should return wrong password error', async () => {
    const result = await supertest(app)
      .post('/api/users/login')
      .set('content-type', 'application/json')
      .send({
        email: EXISTING_USER.email,
        password: "apajalah983274",
      })
    expect(result.status).toBe(400);
  })

  it('should successfully login user', async () => {
    const result = await supertest(app)
      .post('/api/users/login')
      .set('content-type', 'application/json')
      .send({
        email: EXISTING_USER.email,
        password: EXISTING_USER.password
      })
    expect(result.status).toBe(200);
    expect(result.body.data.access_token).toBeDefined();
    expect(result.body.data.refresh_token).toBeDefined();
    expect(typeof result.body.data.access_token).toBe('string');
    expect(typeof result.body.data.refresh_token).toBe('string');
    expect(result.body.data.access_token.length).toBeGreaterThanOrEqual(10);
    expect(result.body.data.refresh_token.length).toBeGreaterThanOrEqual(10);
  })
})

describe('GET /api/email/confirm', () => {
  let key
  let email

  beforeAll(async () => {
    const tempUser = await createTempUser()
    key = tempUser.key
    email = tempUser.email
  })

  afterAll(async () => {
    await User.findOneAndDelete({email})
  })
  
  it('should return validation error', async () => {
    const result = await supertest(app)
      .get('/api/users/email/confirm')
    expect(result.status).toBe(400)
  })
  
  it('should return key not found error', async () => {
    const result = await supertest(app)
      .get('/api/users/email/confirm')
      .query({key: 'random'})
    expect(result.status).toBe(404)
  })

  it('should return success', async () => {
    const result = await supertest(app)
      .get('/api/users/email/confirm')
      .query({key})
    expect(result.status).toBe(201)
  })
})

describe('DELETE /api/users/logout', () => {
  let accessToken

  beforeAll(async () => {
    const result = await login()
    accessToken = result.accessToken
  })

  afterAll(async () => {
    await deleteAllSessionInRedis()
  })

  it('should return invalid token error', async () => {
    const result = await supertest(app)
      .delete('/api/users/logout')
      .set('authorization', 'Bearer invalidtoken')
    expect(result.status).toBe(401)
  })

  it('should return success', async () => {
    const result = await supertest(app)
      .delete('/api/users/logout')
      .set('authorization', 'Bearer ' + accessToken)
    expect(result.status).toBe(200)
  })
})

describe('POST /api/users/refresh-token', () => {
  let accessToken
  let refreshToken

  beforeAll(async () => {
    const result = await login()
    accessToken = result.accessToken
    refreshToken = result.refreshToken
  })

  afterAll(async () => {
    await deleteAllSessionInRedis()
  })

  it('should return validation error', async () => {
    const result = await supertest(app)
      .post('/api/users/refresh-token')
      .set('authorization', 'Bearer ' + accessToken)
      .set('content-type', 'application/json')
      .send({})
    expect(result.status).toBe(400)
  })
  
  it('should return not found error', async () => {
    const result = await supertest(app)
      .post('/api/users/refresh-token')
      .set('authorization', 'Bearer ' + accessToken)
      .set('content-type', 'application/json')
      .send({
        refresh_token: "loremipsumdoloramet"
      })
    expect(result.status).toBe(404)
  })
  
  it('should return success', async () => {
    const result = await supertest(app)
      .post('/api/users/refresh-token')
      .set('authorization', 'Bearer ' + accessToken)
      .set('content-type', 'application/json')
      .send({
        refresh_token: refreshToken
      })
    expect(result.status).toBe(200)
    expect(result.body.data.access_token).toBeDefined()
    expect(typeof result.body.data.access_token).toBe('string')
    expect(result.body.data.access_token.length).toBeGreaterThanOrEqual(10)
  })
})