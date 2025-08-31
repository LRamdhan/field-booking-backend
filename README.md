# Lapangku - Backend

<hr/>

## Preparation

Create .env file using .env.example, fill all required fields!

<br/>

## How To Run Server


<br/>

1. Run Mongodb
```bash
c:
mongod --auth
```

<br/>

2. Run Redis
```bash
cd redis
redis-stack-server redis.conf
```

<br/>

3. Run Seeder
```bash
npm run seed
```

<br/>

4. Run Server
```bash
npm run dev
```

<br/>


## Using Docker


Pulls all required images and runs it all via docker compose
```bash
npm run compose
```

<br/>

## Documentation
access api docs at http://locahost:3000/docs