# User Management

<hr/>

## Register

Role : CUSTOMER | ADMIN

Enpoint : POST /api/users/register

Header: 
- content-type: application/json

Request Body :
```json
{
  "name": "Ramdhan",
  "city": "Wado",
  "district": "Malangbong",
  "subdistrict": "Cisarua",
  "email": "dhan@yahoo.com",
  "password": "secret",
}
```

Response Success :
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {}
}
```

Response Error :
```json
{
  "success": false,
  "message": "Registrasi gagal",
  "data": {}
}
```


## Login

Role : CUSTOMER | ADMIN

Enpoint : POST /api/users/login

Header: 
- content-type: application/json

Request Body :
```json
{
  "email": "test@google.com",
  "password": "secret"
}
```

Response Success :
```json
{
  "success": true,
  "message": "Login Berhasil",
  "data": {
    "access_token": "loremipsomdoloramet",
    "refresh_token": "loremipsomdoloramet"
  }
}
```

Response Error : 
```json
{
  "success": false,
  "message": "Login gagal",
  "data": {}
}
```


## Logout

Role : CUSTOMER | ADMIN

Enpoint : DELETE /api/users/logout

Header: 
- authorization: token

Response Success :
```json
{
  "success": true,
  "message": "Logout Berhasil",
  "data": {}
}
```

Response Error : 
```json
{
  "success": false,
  "message": "Logout gagal",
  "data": {}
}
```
