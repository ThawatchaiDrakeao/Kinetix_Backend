# KINETIX Backend API Spec

## PATCH /api/products/new-brand/:id

### Purpose

Add an existing product model into an existing Brand.

### Method

`PATCH`

### Path

`/api/products/new-brand/:id`

### Authentication / Authorization

Protected by `authStaff`.

The request must include a valid staff token through either:

- `Authorization: Bearer <STAFF_TOKEN>`
- `accessToken` cookie

### Path Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | MongoDB ObjectId | Yes | Brand document ID |

### Request Body

```json
{
  "modelId": "PRODUCT_MODEL_OBJECT_ID"
}
```

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `modelId` | MongoDB ObjectId | Yes | Product model document ID to add to the Brand |

### Success Response

Status: `200`

```json
{
  "success": true,
  "message": "Product model added to brand successfully",
  "data": {
    "brand": {}
  }
}
```

### Error Responses

| Status | Condition |
| --- | --- |
| `400` | Invalid Brand ObjectId |
| `400` | Missing `modelId` |
| `400` | Invalid product model ObjectId |
| `401` | Missing, invalid, expired, or malformed staff token |
| `404` | Brand not found |
| `404` | Product model not found |
| `409` | Product model already exists in this Brand |

### Notes

- The final verified route is mounted through `server.js` at `/api`, `routes/index.js` at `/products`, and `product.router.js` at `/new-brand/:id`.
- The Brand schema stores product model entries in the existing `model` array field.
- The endpoint does not accept arbitrary Brand updates from `req.body`.
- Real integration verification can be run with `npm run test:brand-api` after the backend is running.
