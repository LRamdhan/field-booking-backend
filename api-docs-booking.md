# Booking Api Docs

<hr/>


## Get Fields

Role : CUSTOMER | ADMIN

Enpoint : GET /api/fields

Header : 
- authorization: token

Response Success :
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "jifwuriwo",
      "name": "Lapang B",
      "rating": 4.5,
      "img": "https://img.com/jifweuriw",
      "location": "indoor",
      "cost": 100000
    },
    ...
  ]
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


## Get Field Detail

Role : CUSTOMER | ADMIN

Enpoint : GET /api/fields/:id

Header : 
- authorization: token

Response Success :
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "iuewjofwi",
    "name": "Lapang A",
    "cost": 80000,
    "rating": 3.4,
    "images": ["https://img.com/jifweuriw", "https://img.com/jifweuriw", ...],
    "location": "outdoor",
    "floor_type": "vinyl",
    "facilities": ["backup balls", "scoring board", "seats", ...]
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



## Get Reviews

Role : CUSTOMER | ADMIN

Enpoint : GET /api/reviews

Header : 
- authorization: token

Queries : 
- page: 2
- limit: 5
- star: 3 (optional)

Response Success :
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "page": 2,
    "average_rating": 3.3,
    "total_reviews": 70,
    "reviews": [
      {
        "username": "Udin",
        "img_profile": "https://img.com/jifweuriw",
        "date_created": "30 Maret 2025",
        "rating": 4,
        "description": "lorem ipsum dolor amet"
      },
      ...
    ]
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

## Get Booked Schedules

Role : CUSTOMER | ADMIN

Enpoint : GET /api/fields/:id/schedules

Header : 
- authorization: token

Queries: 
- date: Date


Response Success :
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "date": Date,
    "hours": [10, 12, 18, 21]
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

## Create Booking

Role : CUSTOMER

Enpoint : POST /api/bookings

Header: 
- content-type: application/json
- authorization: token

Request Body :
```json
{
  "field_id": "uiwrjogwo",
  "schedule": DateTime,
  "payment_type": "COD",
}
```

Response Success :
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "booking_id": "uriwfwfjoiqpqa",
    "payment_token": "iwejfojowuoq" // depends on payment_type
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

## Transaction Update

Role : ANY

Enpoint : POST /api/bookings/update

Header: 
- content-type: application/json

Request Body :
```json
{
  "order_id": "jofiwuo2o",
  "transaction_time": DateTime,
  "transaction_status": "pending",
  ...
}
```

Response Success :
```json
{
  "success": true,
  "message": "Success",
  "data": {}
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

## Get Bookings

Role : CUSTOMER

Enpoint : GET /api/bookings

Header : 
- authorization: token

Queries :
- page
- limit
- status (optional)
- create_order (optional)
- field_id (optional)

Response Success :
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "status": "pending",
    "create_order": "asc",
    "field_id": "joiwuirowjio",
    "page": 3,
    "bookings": [
      {
        "id": "iowuiorjofs",
        "field_name": "Lapang C",
        "schedule": DateTime,
        "img": "https://img.com/jifowo",
        "status": "aktif",
        "payment_token": "jfowuroiw" // depends on payment type
      },
      ...
    ]
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

## Get Detail Booking

Role : CUSTOMER

Enpoint : GET /api/bookings/:id

Header: 
- authorization: token

Response Success :
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "jifwouroiw",
    "payment_token": "jfiwuiorj", // depends on payment type
    "status": "pending",
    "created_date": DateTime,
    "schedule": DateTime,
    "field": {
      "field_id": "jifewuoriwj",
      "name": "Lapang B",
      "location": "indoor",
      "img": "https://img.com/jifowi",
      "cost": 90000,
      "payment_type": "bayar sekarang",
      "total": 90000
    }
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

## Cancel Booking

Role : CUSTOMER

Enpoint : DELETE /api/bookings/:id

Header: 
- authorization: token

Response Success :
```json
{
  "success": true,
  "message": "Success",
  "data": {}
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

## Create Review

Role : CUSTOMER

Enpoint : POST /api/bookings/:id/review

Header: 
- content-type: application/json
- authorization: token

Request Body :
```json
{
  "description": "lorem ipsum dolor amet",
  "rating": "4"
}
```

Response Success :
```json
{
  "success": true,
  "message": "Success",
  "data": {}
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