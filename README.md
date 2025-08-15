# Lapangku - Backend

<hr/>

## How To Run Server

1. Create .env file using .env.example, fill all required fields

<br/>

2. Run Mongodb
```bash
c:
mongod --auth
```

<br/>

3. Run Redis
```bash
cd redis
redis-stack-server redis.conf
```

<br/>

4. Run Seeder
```bash
npm run seed
```

<br/>

5. Run Server
```bash
npm run dev
```

<br/>

## Documentation
access api docs at http://locahost:3000/docs