# 1. GET /users

Headers :
- authorization

Response Success :
```json
{
  "error": false,
  "message": "Success",
  "data": {
    "name": "example",
    "email": "example",
    "img_url": "example",
    "city": "example",
    "district": "example",
    "sub_district": "example",
  }
}
```

Response Error :
```json
{
  "error": true,
  "message": "Error",
  "data": {}
}
```

<hr/>

# 2. PATCH /users

Headers :
- authorization

Request Body (multipart/form-data) :
```json
{
  "name": "example",
  "img": image,
  "city": "example",
  "district": "example",
  "sub_district": "example",
}
```

Response Success :
```json
{
  "error": false,
  "message": "Success",
  "data": {
    "name": "example",
    "email": "example",
    "img_url": "example",
    "city": "example",
    "district": "example",
    "sub_district": "example",
  }
}
```

Response Error :
```json
{
  "error": true,
  "message": "Error",
  "data": {}
}
```


<hr/>

# 3. GET /users/devices

Headers :
- authorization

Response Success :
```json
{
  "error": false,
  "message": "Success",
  "data": [
    {
      "id": "example",
      "last_login": "example",
      "os": "example",
      "device": "example",
      "platform": "example",
      "browser": "example",
    },
    ...
  ]
}
```

Response Error :
```json
{
  "error": true,
  "message": "Error",
  "data": {}
}
```

<hr/>

# 4. DELETE /users/devices/:id

Headers :
- authorization

Response Success :
```json
{
  "error": false,
  "message": "Success",
  "data": {}
}
```

Response Error :
```json
{
  "error": true,
  "message": "Error",
  "data": {}
}
```

<hr/>

# 5. GET /users/password/change-request

Headers :
- authorization

Response Success :
```json
{
  "error": false,
  "message": "Success",
  "data": {}
}
```

Response Error :
```json
{
  "error": true,
  "message": "Error",
  "data": {}
}
```

<hr/>

# 6. PATCH /users/password

Headers :
- authorization

Request Body :
```json
{
  "otp": 7428,
  "new_password": "yabegitlah"
}
```

Response Success :
```json
{
  "error": false,
  "message": "Success",
  "data": {}
}
```

Response Error :
```json
{
  "error": true,
  "message": "Error",
  "data": {}
}
```

<hr/>

# 7. POST /users/password/reset-request

Request Body :
```json
{
  "email": "example"
}
```

Response Success :
```json
{
  "error": false,
  "message": "Success",
  "data": {}
}
```

Response Error :
```json
{
  "error": true,
  "message": "Error",
  "data": {}
}
```

<hr/>

# 8. PATCH /users/password/reset

Request Body :
```json
{
  "otp": 7428,
  "new_password": "yabegitlah"
}
```

Response Success :
```json
{
  "error": false,
  "message": "Success",
  "data": {}
}
```

Response Error :
```json
{
  "error": true,
  "message": "Error",
  "data": {}
}
```