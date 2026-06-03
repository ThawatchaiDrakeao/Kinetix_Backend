# KINETIX Backend Handoff

อัปเดตล่าสุด: 2026-06-03

## ภาพรวม

งานรอบนี้จัดโครง backend หลัง merge, เพิ่ม API สำหรับผูก Product model เข้า Brand, เพิ่มไฟล์ test สำหรับยิง API จริง และรวมเอกสารให้เหลือไฟล์เดียวเพื่อให้ทีมเปิดอ่านง่าย

## API ที่เพิ่ม

### Add Product Model To Brand

```http
PATCH /api/products/new-brand/:id
Authorization: Bearer <STAFF_TOKEN>
Content-Type: application/json
```

```json
{
  "modelId": "PRODUCT_MODEL_OBJECT_ID"
}
```

รายละเอียด:

- `:id` คือ Brand document ID
- `modelId` คือ Product document ID ที่ต้องการเพิ่มเข้า Brand
- route นี้ใช้ `authStaff`
- Product model ต้องมีอยู่จริงก่อน
- Brand ต้องมีอยู่จริงก่อน
- Product model เดิมห้ามถูกเพิ่มซ้ำใน Brand เดิม

Response สำเร็จ:

```json
{
  "success": true,
  "message": "Product model added to brand successfully",
  "data": {
    "brand": {}
  }
}
```

Error ที่รองรับ:

| Status | กรณี |
| --- | --- |
| `400` | Brand ID format ผิด |
| `400` | ไม่ส่ง `modelId` |
| `400` | Product model ID format ผิด |
| `401` | ไม่มี staff token หรือ token ผิด/หมดอายุ |
| `404` | ไม่เจอ Brand |
| `404` | ไม่เจอ Product model |
| `409` | Product model ถูกเพิ่มใน Brand นี้แล้ว |

## ไฟล์ที่แก้หรือเพิ่ม

### `src/modules/controller/products.controller.js`

เพิ่ม `addProductModelToBrand`

ทำงานดังนี้:

1. อ่าน Brand ID จาก `req.params.id`
2. อ่าน Product model ID จาก `req.body.modelId`
3. ตรวจว่า ID ทั้งสองตัวเป็น MongoDB ObjectId
4. หา Brand จาก database
5. หา Product จาก database
6. เช็กว่า Product model นี้อยู่ใน Brand แล้วหรือยัง
7. ถ้ายังไม่มี ให้เพิ่มเข้า `Brand.model`
8. ส่ง Brand ที่อัปเดตแล้วกลับไป

### `src/routes/product.router/product.router.js`

เพิ่ม route:

```js
router.patch("/new-brand/:id", authStaff, addProductModelToBrand);
```

เมื่อต่อกับ route mount ในโปรเจกต์ จะได้ path จริง:

```http
PATCH /api/products/new-brand/:id
```

### `src/middelware/authStaff.js`

แก้ middleware ให้ใช้งานได้จริง:

- รับ token จาก `Authorization: Bearer <token>`
- รับ token จาก cookie `accessToken`
- verify ด้วย `JWT_STAFF_SECRETKEY`
- รองรับ payload key หลายแบบ: `staffId`, `userId`, `id`, `_id`
- token ถูกต้องแล้วเรียก `next()`
- token หายหรือผิด ตอบ `401`

### `src/middelware/authUser.js`

แก้ syntax ที่ทำให้ import พัง:

- ลบ `export default authUser;` ที่ซ้ำ
- ลบ import ที่ไม่ได้ใช้

### `src/modules/controller/user.controller.js`

แก้จุดที่ทำให้ระบบ user พัง:

- ลบ import `User` ที่ซ้ำ
- แก้ login query จากหา field ผิดเป็น:

```js
User.findOne({ email: userEmail })
```

### `src/server.js`

จัด error middleware ให้เหลือจุดหลัง route และไม่ส่ง stack trace ใน production

### `scripts/test-add-product-model-to-brand.js`

เพิ่มไฟล์ test สำหรับยิง API จริง

สิ่งที่ test ทำ:

1. ต่อ MongoDB ด้วย `MONGODB_URI`
2. สร้าง Brand test
3. สร้าง Product test
4. สร้าง staff JWT ด้วย `JWT_STAFF_SECRETKEY`
5. ยิง API จริงไปที่ server:

```http
PATCH /api/products/new-brand/:id
```

6. ตรวจ case เหล่านี้:

| Case | Expected |
| --- | --- |
| เพิ่ม Product model เข้า Brand สำเร็จ | `200` |
| เพิ่มซ้ำ | `409` |
| ไม่ส่ง `modelId` | `400` |
| Brand ID format ผิด | `400` |
| Product model ID format ผิด | `400` |
| Brand ไม่เจอ | `404` |
| Product model ไม่เจอ | `404` |
| ไม่ส่ง token | `401` |

7. ลบ Brand/Product test data หลังจบ test

### `package.json`

เพิ่ม script:

```json
{
  "test:brand-api": "node --env-file=.env scripts/test-add-product-model-to-brand.js"
}
```

## วิธีเทสจริง

ต้องมี `.env` ที่มีค่า:

```env
MONGODB_URI=...
JWT_STAFF_SECRETKEY=...
```

Terminal 1: รัน server

```bash
npm run dev
```

Terminal 2: รัน test

```bash
npm run test:brand-api
```

ถ้า server ใช้ URL อื่น ให้กำหนด `API_BASE_URL`

PowerShell:

```powershell
$env:API_BASE_URL="http://localhost:5000"
npm run test:brand-api
```

ผลที่ควรเห็นเมื่อผ่าน:

```text
[pass] success: add product model to brand -> 200
[pass] duplicate: same model cannot be added twice -> 409
[pass] missing modelId -> 400
[pass] invalid brand id -> 400
[pass] invalid product model id -> 400
[pass] brand not found -> 404
[pass] product model not found -> 404
[pass] missing authorization -> 401
[done] PATCH /api/products/new-brand/:id integration checks passed
```

## ข้อผิดพลาดที่ถูกแก้

- `products.controller.js` เคยมีท้ายไฟล์ syntax พังจากข้อความค้าง `export const createNewBrand = asyn`
- `product.router.js` เคยมี route patch ผิดเป็น `/newBrand` และเรียก `createNewBrand` แทน logic เพิ่ม product model เข้า Brand
- `authStaff.js` เคยอ่าน `req.cookie` ผิด ควรเป็น `req.cookies`
- `authStaff.js` เคยมีเงื่อนไขกลับด้าน ทำให้ token ถูกต้องแล้วไม่ `next()`
- `authUser.js` เคย export default ซ้ำ ทำให้ module import พัง
- `user.controller.js` เคย import `User` ซ้ำ ทำให้ syntax error
- `user.controller.js` login เคย query field ผิด ทำให้หา user ไม่เจอ
- `server.js` เคยมี error middleware ซ้ำ และตัวหนึ่งอยู่ก่อน route
- repo เคยมี merge conflict ค้าง ตอนนี้ถูก resolve และ commit ไปแล้ว

## Verification ล่าสุด

ตรวจแล้ว:

- `node --check` ทุกไฟล์ `.js` ใน `src` ผ่าน
- `product.router.js` import ผ่าน
- `authStaff` token ถูกต้องผ่าน
- `authStaff` ไม่มี token ได้ `401`
- `npm.cmd test` ยังเป็น placeholder ของโปรเจกต์เดิม: `Error: no test specified`
- test จริงสำหรับ endpoint นี้คือ `npm run test:brand-api`

## Git

commit ล่าสุดที่รวมงาน endpoint และ resolve merge:

```text
486d449 feat(products): add product model to brand
```

## Real Integration Test Result

รันจริงล่าสุดด้วย:

```powershell
$env:API_BASE_URL="http://localhost:5000"
npm.cmd run test:brand-api
```

ผลลัพธ์:

```text
[pass] success: add product model to brand -> 200
[pass] duplicate: same model cannot be added twice -> 409
[pass] missing modelId -> 400
[pass] invalid brand id -> 400
[pass] invalid product model id -> 400
[pass] brand not found -> 404
[pass] product model not found -> 404
[pass] missing authorization -> 401
[pass] invalid authorization -> 401
[pass] cleanup: temporary test data removed
[done] PATCH /api/products/new-brand/:id integration checks passed
```

หมายเหตุ: ก่อนหน้านี้ port `5000` เคยตอบ `404 Route not found` เพราะเป็น backend instance เก่าที่ยังไม่ได้โหลด route ล่าสุด หลัง restart backend จาก workspace ปัจจุบันแล้ว `PATCH /api/products/new-brand/:id` บน port `5000` ผ่าน integration test ครบทุก case
