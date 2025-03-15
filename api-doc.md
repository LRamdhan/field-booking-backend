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
  "sub_district": "Cisarua",
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

## Confirm Email
Role : CUSTOMER

Enpoint : GET /api/users/email/confirm

Params :
- key

Response Success
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ...
  Konfirmasi Berhasil, Anda bisa langsung login, atau kembali ke halaman sebelunya
  ...
```

Response Error
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ...
  Konfirmasi Gagal, Anda telah melebihi batas waktu yang diberikan, 
  silahkan lakukan registrasi kembali
  ...
```


## Login Google

Role : CUSTOMER | ADMIN

Enpoint : GET /api/users/login/google

Response : Redirect to dashboard or certain page


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

## Refresh Token

Role : CUSTOMER | ADMIN

Enpoint : POST /api/users/refresh-token

Request Body : 

```json
{
  "refresh_token": "loremipsumdoloramet"
}
```
Response Success :
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "access_token": "loremipsumdoloramet"
  }
}
```

Response Error : 
```json
{
  "success": false,
  "message": "Fail",
  "data": {}
}
```