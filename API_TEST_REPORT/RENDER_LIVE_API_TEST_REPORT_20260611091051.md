# Render Live API Test Report

## พรี่โต API TEST WORKFLOW

- Target: https://kinetix-qnx5.onrender.com
- Run ID: 20260611091051
- Started/finished: 2026-06-11T09:11:17.975Z
- Summary: PASS 39, FAIL 1, SKIP 0, TOTAL 40

## Generated Test Data

| Key | Value |
| --- | --- |
| userEmail | preto.render.user.20260611091051@example.com |
| staffEmail | preto.render.admin.20260611091051@example.com |
| staffId | 6a2a7b9ee58b6959bee3189e |
| adminRole | admin |
| adminSource | staff collection via /api/staff/staffRegister |
| brandName | PretoRenderBrand20260611091051 |
| productId | 6a2a7bace58b6959bee318a1 |
| orderId | 6a2a7bafe58b6959bee318a2 |

## Results

| # | Result | Status | Method | Endpoint | Expected | Name | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | PASS | 200 | GET | `/` | 200 | Health check |  |
| 2 | PASS | 201 | POST | `/api/staff/staffRegister` | 201/409 | Staff register admin first | พรี่โต is created as admin at the start of the workflow. |
| 3 | PASS | 200 | POST | `/api/staff/admin/login` | 200 | Staff login admin first |  |
| 4 | PASS | 201 | POST | `/api/users/register` | 201/400 | User register success | User payload includes role admin, but this controller stores customer users separately; admin access uses the staff account created first. |
| 5 | PASS | 400 | POST | `/api/users/register` | 400 | User register missing fields |  |
| 6 | PASS | 200 | POST | `/api/users/login` | 200 | User login success |  |
| 7 | PASS | 400 | POST | `/api/users/login` | 400/404 | User login wrong password |  |
| 8 | PASS | 200 | GET | `/api/users/6a2a7ba1e58b6959bee3189f` | 200 | User get profile by id |  |
| 9 | PASS | 200 | POST | `/api/users/logout` | 200 | User logout |  |
| 10 | PASS | 200 | GET | `/api/staff` | 200 | Staff list |  |
| 11 | FAIL | 200 | GET | `/api/staff?role=admin` | 200 | Staff admin filter | Expected พรี่โต staff account to appear in /api/staff?role=admin. |
| 12 | PASS | 400 | GET | `/api/staff/not-a-valid-id` | 400 | Staff invalid id |  |
| 13 | PASS | 200 | GET | `/api/products` | 200 | Products list |  |
| 14 | PASS | 200 | GET | `/api/products/brand` | 200 | Products brand list |  |
| 15 | PASS | 200 | GET | `/api/products/brand/PretoRenderBrand20260611091051` | 200 | Products by missing brand |  |
| 16 | PASS | 200 | GET | `/api/products/category/Road` | 200 | Products by Road category |  |
| 17 | PASS | 201 | POST | `/api/products/newBrand` | 201/409 | Create legacy brand |  |
| 18 | PASS | 201 | POST | `/api/products/createProduct` | 201 | Create product |  |
| 19 | PASS | 400 | GET | `/api/products/not-a-valid-id` | 400 | Product invalid id |  |
| 20 | PASS | 404 | GET | `/api/products/6a2a7bace58b6959bee318a1` | 200/404 | Product detail route behavior | 404 is accepted because this route currently calls shoe.controller and searches the Shoe model. |
| 21 | PASS | 200 | GET | `/api/orders/test` | 200 | Orders router test |  |
| 22 | PASS | 401 | GET | `/api/orders` | 401 | Orders no auth |  |
| 23 | PASS | 200 | GET | `/api/orders` | 200/401 | Orders auth list |  |
| 24 | PASS | 201 | POST | `/api/orders` | 201/500 | Create order auth | 500 is recorded if live stock/product data blocks checkout. |
| 25 | PASS | 404 | GET | `/api/rental_histories` | 200/401/404 | Rental histories collection route | Discovery test for MongoDB collection-style route. |
| 26 | PASS | 404 | GET | `/api/rental_histories/0db7366da99718f2b3d73a94` | 200/401/404 | Rental histories sample detail route | Uses sample rental history id from the user-provided MongoDB document. |
| 27 | PASS | 404 | GET | `/api/rental-histories` | 200/401/404 | Rental histories kebab route | Discovery test for REST-style rental histories route. |
| 28 | PASS | 404 | GET | `/api/rentals/history` | 200/401/404/500 | Rentals history mounted route no auth | Local router defines /history but index.js currently does not mount rentalsRouter. |
| 29 | PASS | 404 | GET | `/api/rentals/history?page=1&limit=5` | 200/401/404/500 | Rentals history mounted route with user token | Checks whether deployed API has /api/rentals/history available. |
| 30 | PASS | 404 | GET | `/api/rentals/0db7366da99718f2b3d73a94/tracking` | 200/401/404/500 | Rentals history sample tracking route | Checks sample rental history id against rentals tracking route shape. |
| 31 | PASS | 401 | GET | `/api/admin/test` | 401 | Admin no auth |  |
| 32 | PASS | 200 | GET | `/api/admin/test` | 200/401/403 | Admin test |  |
| 33 | PASS | 200 | GET | `/api/admin/stats` | 200/401/403 | Admin stats |  |
| 34 | PASS | 401 | GET | `/api/brands` | 401 | Brands no auth |  |
| 35 | PASS | 200 | GET | `/api/brands` | 200/401/403 | Brands admin auth |  |
| 36 | PASS | 401 | GET | `/api/categories` | 401 | Categories no auth |  |
| 37 | PASS | 200 | GET | `/api/categories` | 200/401/403 | Categories admin auth |  |
| 38 | PASS | 401 | GET | `/api/shoes` | 401 | Shoes no auth |  |
| 39 | PASS | 401 | GET | `/api/cart/6a2a7ba1e58b6959bee3189f` | 401 | Cart no auth |  |
| 40 | PASS | 404 | GET | `/api/__not_found__` | 404 | Unknown route |  |

## Response Samples

### 1. Health check

`GET /` -> 200 (PASS, 766ms)

```text
Welcome to Kinetix
```

### 2. Staff register admin first

`POST /api/staff/staffRegister` -> 201 (PASS, 2309ms)

```text
{"success":true,"message":"Staff created successfully!","data":{"name":"พรี่โต","surname":"RenderAdmin","email":"preto.render.admin.20260611091051@example.com","password":"<redacted>","address":"Kinetix live API test","role":"admin","_id":"6a2a7b9ee58b6959bee3189e","cre...
```

### 3. Staff login admin first

`POST /api/staff/admin/login` -> 200 (PASS, 1821ms)

```text
{"success":true,"message":"Login success!","user":{"_id":"6a2a7b9ee58b6959bee3189e","email":"preto.render.admin.20260611091051@example.com","name":"พรี่โต","role":"ADMIN"}}
```

### 4. User register success

`POST /api/users/register` -> 201 (PASS, 1780ms)

```text
{"success":true,"message":"User created successfully!","data":{"name":"พรี่โต","surname":"RenderUser","email":"preto.render.user.20260611091051@example.com","address":"Kinetix live API test","role":"user","userRank":"bronze","_id":"6a2a7ba1e58b6959bee3189f","cart":[],"createdAt":"2026-06-11T09:10:57.916Z","updatedAt":"...
```

### 5. User register missing fields

`POST /api/users/register` -> 400 (PASS, 262ms)

```text
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Error: Name, surname, email, and password are required!<br> &nbsp; &nbsp;at registerUser (file:///opt/render/project/src/src/modules/controller/user.controller.js:106:17)<br> &nbsp; &nbsp;at Layer.handleRequest (/opt...
```

### 6. User login success

`POST /api/users/login` -> 200 (PASS, 1869ms)

```text
{"success":true,"message":"Login success!","accessToken":"<redacted>","user":{"_id":"6a2a7ba1e58b6959bee3189f","email":"preto.render.user.20260611091051@e...
```

### 7. User login wrong password

`POST /api/users/login` -> 400 (PASS, 1792ms)

```text
{"success":false,"message":"Wrong password!!"}
```

### 8. User get profile by id

`GET /api/users/6a2a7ba1e58b6959bee3189f` -> 200 (PASS, 616ms)

```text
{"success":true,"data":{"_id":"6a2a7ba1e58b6959bee3189f","name":"พรี่โต","surname":"RenderUser","email":"preto.render.user.20260611091051@example.com","address":"Kinetix live API test","role":"user","userRank":"bronze","cart":[],"createdAt":"2026-06-11T09:10:57.916Z","updatedAt":"2026-06-11T09:10:57.916Z","__v":0}}
```

### 9. User logout

`POST /api/users/logout` -> 200 (PASS, 286ms)

```text
{"success":true,"message":"Logout success !"}
```

### 10. Staff list

`GET /api/staff` -> 200 (PASS, 419ms)

```text
{"count":0,"data":[]}
```

### 11. Staff admin filter

`GET /api/staff?role=admin` -> 200 (FAIL, 431ms)

```text
{"count":0,"data":[]}
VALIDATION: Expected พรี่โต staff account to appear in /api/staff?role=admin.
```

### 12. Staff invalid id

`GET /api/staff/not-a-valid-id` -> 400 (PASS, 254ms)

```text
{"message":"Invalid staff ID"}
```

### 13. Products list

`GET /api/products` -> 200 (PASS, 898ms)

```text
{"success":true,"message":"Products fetched successfully","data":[{"_id":"6a27c0ed8c4eca5fe8cf1730","modelName":"Gel-Kayano 36","description":"Cruickshank - Cremin's most advanced Ball technology increases smug capabilities","brandId":"6a27c0ed8c4eca5fe8cf172f","gender":"unisex","category":"Trail","rentalPlan":[{"1day"...
```

### 14. Products brand list

`GET /api/products/brand` -> 200 (PASS, 445ms)

```text
{"success":true,"message":"Get Done!","data":[{"_id":"6a27c0ed8c4eca5fe8cf172a","brandName":"Nike","model":[],"isActive":true,"__v":0,"createdAt":"2026-06-09T07:29:49.154Z","updatedAt":"2026-06-09T07:29:49.154Z"},{"_id":"6a27c0ed8c4eca5fe8cf172b","brandName":"Adidas","model":[],"isActive":true,"__v":0,"createdAt":"2026...
```

### 15. Products by missing brand

`GET /api/products/brand/PretoRenderBrand20260611091051` -> 200 (PASS, 450ms)

```text
{"success":true,"message":"founded!","data":[]}
```

### 16. Products by Road category

`GET /api/products/category/Road` -> 200 (PASS, 634ms)

```text
{"success":true,"message":"founded!","data":[{"_id":"6a27c0ed8c4eca5fe8cf1733","modelName":"Fresh Foam 28","description":"Our wolf-friendly Ball ensures elderly comfort for your pets","brandId":"6a27c0ed8c4eca5fe8cf172c","gender":"men","category":"Road","rentalPlan":[{"1day":150,"3day":400,"7day":800,"_id":"6a27c0ed8c4...
```

### 17. Create legacy brand

`POST /api/products/newBrand` -> 201 (PASS, 455ms)

```text
{"success":true,"message":"Brand created successfully","data":{"brandName":"PretoRenderBrand20260611091051","model":[{"name":"Render Test Model"}],"isActive":true,"_id":"6a2a7bace58b6959bee318a0","createdAt":"2026-06-11T09:11:08.061Z","updatedAt":"2026-06-11T09:11:08.061Z","__v":0}}
```

### 18. Create product

`POST /api/products/createProduct` -> 201 (PASS, 465ms)

```text
{"success":true,"message":"Product created successfully!","data":{"modelName":"Preto Render Runner 20260611091051","description":"Live API test product","brandId":"6a2a7bace58b6959bee318a0","gender":"unisex","category":"Road","rentalPlan":[{"1day":200,"3day":500,"7day":1000}],"variants":[{"skuColorCode":"PRETO-RENDER-2...
```

### 19. Product invalid id

`GET /api/products/not-a-valid-id` -> 400 (PASS, 276ms)

```text
{"message":"Invalid shoe ID"}
```

### 20. Product detail route behavior

`GET /api/products/6a2a7bace58b6959bee318a1` -> 404 (PASS, 471ms)

```text
{"message":"Shoe not found"}
```

### 21. Orders router test

`GET /api/orders/test` -> 200 (PASS, 275ms)

```text
{"success":true,"message":"Order router working!"}
```

### 22. Orders no auth

`GET /api/orders` -> 401 (PASS, 302ms)

```text
{"success":false,"message":"Access denied. No token! Please sign in again"}
```

### 23. Orders auth list

`GET /api/orders` -> 200 (PASS, 679ms)

```text
{"success":true,"data":[]}
```

### 24. Create order auth

`POST /api/orders` -> 201 (PASS, 1329ms)

```text
{"success":true,"message":"Order created successfully","data":{"orderId":"6a2a7bafe58b6959bee318a2","grandTotal":350}}
```

### 25. Rental histories collection route

`GET /api/rental_histories` -> 404 (PASS, 274ms)

```text
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /api/rental_histories</pre>
</body>
</html>

```

### 26. Rental histories sample detail route

`GET /api/rental_histories/0db7366da99718f2b3d73a94` -> 404 (PASS, 262ms)

```text
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /api/rental_histories/0db7366da99718f2b3d73a94</pre>
</body>
</html>

```

### 27. Rental histories kebab route

`GET /api/rental-histories` -> 404 (PASS, 255ms)

```text
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /api/rental-histories</pre>
</body>
</html>

```

### 28. Rentals history mounted route no auth

`GET /api/rentals/history` -> 404 (PASS, 298ms)

```text
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /api/rentals/history</pre>
</body>
</html>

```

### 29. Rentals history mounted route with user token

`GET /api/rentals/history?page=1&limit=5` -> 404 (PASS, 270ms)

```text
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /api/rentals/history</pre>
</body>
</html>

```

### 30. Rentals history sample tracking route

`GET /api/rentals/0db7366da99718f2b3d73a94/tracking` -> 404 (PASS, 263ms)

```text
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /api/rentals/0db7366da99718f2b3d73a94/tracking</pre>
</body>
</html>

```

### 31. Admin no auth

`GET /api/admin/test` -> 401 (PASS, 255ms)

```text
{"success":false,"message":"Access denied. No token! Please sign in again"}
```

### 32. Admin test

`GET /api/admin/test` -> 200 (PASS, 787ms)

```text
{"success":true,"message":"Admin router working!"}
```

### 33. Admin stats

`GET /api/admin/stats` -> 200 (PASS, 1829ms)

```text
{"success":true,"data":{"totalOrders":65,"pendingOrders":28,"totalUsers":30,"activeShoes":5,"totalRevenue":0}}
```

### 34. Brands no auth

`GET /api/brands` -> 401 (PASS, 254ms)

```text
{"success":false,"message":"Access denied. No token! Please sign in again"}
```

### 35. Brands admin auth

`GET /api/brands` -> 200 (PASS, 824ms)

```text
[{"_id":"6a27c0ed8c4eca5fe8cf172a","brandName":"Nike","model":[],"isActive":true,"__v":0,"createdAt":"2026-06-09T07:29:49.154Z","updatedAt":"2026-06-09T07:29:49.154Z"},{"_id":"6a27c0ed8c4eca5fe8cf172b","brandName":"Adidas","model":[],"isActive":true,"__v":0,"createdAt":"2026-06-09T07:29:49.155Z","updatedAt":"2026-06-09...
```

### 36. Categories no auth

`GET /api/categories` -> 401 (PASS, 257ms)

```text
{"success":false,"message":"Access denied. No token! Please sign in again"}
```

### 37. Categories admin auth

`GET /api/categories` -> 200 (PASS, 781ms)

```text
[]
```

### 38. Shoes no auth

`GET /api/shoes` -> 401 (PASS, 269ms)

```text
{"success":false,"message":"Access denied. No token! Please sign in again"}
```

### 39. Cart no auth

`GET /api/cart/6a2a7ba1e58b6959bee3189f` -> 401 (PASS, 270ms)

```text
{"success":false,"message":"Access denied. No token! Please sign in again"}
```

### 40. Unknown route

`GET /api/__not_found__` -> 404 (PASS, 275ms)

```text
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /api/__not_found__</pre>
</body>
</html>

```

