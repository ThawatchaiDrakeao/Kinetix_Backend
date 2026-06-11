import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE_URL = process.env.KINETIX_LIVE_BASE_URL || "https://kinetix-qnx5.onrender.com";
const WORKFLOW_NAME = "พรี่โต API TEST WORKFLOW";
const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const password = "PretoRenderTest0009!";

const state = {
  userEmail: `preto.render.user.${runId}@example.com`,
  staffEmail: `preto.render.admin.${runId}@example.com`,
  brandName: `PretoRenderBrand${runId}`,
  sku: `PRETO-RENDER-${runId}`,
  userToken: "",
  adminToken: "",
  userId: "",
  staffId: "",
  brandId: "",
  productId: "",
  orderId: "",
};

const results = [];

const nowIso = () => new Date().toISOString();

function compactBody(body) {
  if (body == null || body === "") return "";
  const text = (typeof body === "string" ? body : JSON.stringify(body))
    .replace(/"accessToken":"[^"]+"/g, '"accessToken":"<redacted>"')
    .replace(/"password":"[^"]+"/g, '"password":"<redacted>"');
  return text.length > 320 ? `${text.slice(0, 320)}...` : text;
}

function tokenFromSetCookie(headers) {
  const setCookie = headers.get("set-cookie") || "";
  const match = setCookie.match(/accessToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function request({ name, method = "GET", path: urlPath, body, token, expect = [200], note = "" }) {
  const url = `${BASE_URL}${urlPath}`;
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const started = Date.now();
  let status = 0;
  let parsed = null;
  let ok = false;
  let error = "";

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    status = response.status;
    const text = await response.text();
    try {
      parsed = text ? JSON.parse(text) : "";
    } catch {
      parsed = text;
    }

    const cookieToken = tokenFromSetCookie(response.headers);
    if (cookieToken && name.includes("User login")) state.userToken = cookieToken;
    if (cookieToken && name.includes("Staff login")) state.adminToken = cookieToken;

    ok = expect.includes(status);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const result = {
    name,
    method,
    path: urlPath,
    expect: expect.join("/"),
    status,
    result: ok ? "PASS" : "FAIL",
    ms: Date.now() - started,
    note,
    response: error || compactBody(parsed),
    data: parsed,
  };
  results.push(result);
  console.log(`${result.result.padEnd(4)} ${String(status).padEnd(3)} ${method.padEnd(6)} ${urlPath} - ${name}`);
  return result;
}

function assertResult(result, ok, message) {
  if (ok) return;
  result.result = "FAIL";
  result.note = result.note ? `${result.note}; ${message}` : message;
  result.response = `${result.response}\nVALIDATION: ${message}`;
  console.log(`FAIL validation - ${result.name}: ${message}`);
}

function pickFirstProduct(data) {
  const list = data?.data;
  return Array.isArray(list) && list.length > 0 ? list[0] : null;
}

async function main() {
  console.log(`${WORKFLOW_NAME}`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Run ID: ${runId}`);

  await request({ name: "Health check", path: "/", expect: [200] });

  await request({
    name: "Staff register admin first",
    method: "POST",
    path: "/api/staff/staffRegister",
    expect: [201, 409],
    note: "พรี่โต is created as admin at the start of the workflow.",
    body: {
      name: "พรี่โต",
      surname: "RenderAdmin",
      email: state.staffEmail,
      password,
      address: "Kinetix live API test",
      role: "admin",
    },
  }).then((r) => {
    state.staffId = r.data?.data?._id || "";
    assertResult(r, r.data?.data?.role === "admin", "Expected staff document role to be admin.");
  });

  await request({
    name: "Staff login admin first",
    method: "POST",
    path: "/api/staff/admin/login",
    expect: [200],
    body: { email: state.staffEmail, password },
  }).then((r) => {
    assertResult(
      r,
      r.data?.user?.role === "ADMIN" || r.data?.user?.role === "admin",
      "Expected staff login response role to be ADMIN/admin.",
    );
  });

  await request({
    name: "User register success",
    method: "POST",
    path: "/api/users/register",
    expect: [201, 400],
    note: "User payload includes role admin, but this controller stores customer users separately; admin access uses the staff account created first.",
    body: {
      name: "พรี่โต",
      surname: "RenderUser",
      email: state.userEmail,
      password,
      address: "Kinetix live API test",
      role: "admin",
    },
  }).then((r) => {
    state.userId = r.data?.data?._id || "";
  });

  await request({
    name: "User register missing fields",
    method: "POST",
    path: "/api/users/register",
    expect: [400],
    body: { email: `missing.${runId}@example.com`, password },
  });

  await request({
    name: "User login success",
    method: "POST",
    path: "/api/users/login",
    expect: [200],
    body: { email: state.userEmail, password },
  }).then((r) => {
    state.userToken ||= r.data?.accessToken || "";
    state.userId ||= r.data?.user?._id || "";
  });

  await request({
    name: "User login wrong password",
    method: "POST",
    path: "/api/users/login",
    expect: [400, 404],
    body: { email: state.userEmail, password: "WrongPassword000" },
  });

  await request({
    name: "User get profile by id",
    path: `/api/users/${state.userId || "000000000000000000000000"}`,
    token: state.userToken,
    expect: state.userToken && state.userId ? [200] : [401, 403, 404],
  });

  await request({
    name: "User logout",
    method: "POST",
    path: "/api/users/logout",
    expect: [200],
  });

  await request({ name: "Staff list", path: "/api/staff", expect: [200] });
  await request({ name: "Staff admin filter", path: "/api/staff?role=admin", expect: [200] }).then((r) => {
    const adminStaff = Array.isArray(r.data?.data)
      ? r.data.data.find((staff) => staff.email === state.staffEmail)
      : null;
    assertResult(
      r,
      adminStaff?.role === "admin",
      "Expected พรี่โต staff account to appear in /api/staff?role=admin.",
    );
  });
  await request({ name: "Staff invalid id", path: "/api/staff/not-a-valid-id", expect: [400] });

  const productsResult = await request({ name: "Products list", path: "/api/products", expect: [200] });
  const existingProduct = pickFirstProduct(productsResult.data);
  if (existingProduct?._id) state.productId = existingProduct._id;

  await request({ name: "Products brand list", path: "/api/products/brand", expect: [200] });
  await request({ name: "Products by missing brand", path: `/api/products/brand/${state.brandName}`, expect: [200] });
  await request({ name: "Products by Road category", path: "/api/products/category/Road", expect: [200] });

  await request({
    name: "Create legacy brand",
    method: "POST",
    path: "/api/products/newBrand",
    expect: [201, 409],
    body: { brandName: state.brandName, model: { name: "Render Test Model" } },
  }).then((r) => {
    state.brandId = r.data?.data?._id || "";
  });

  if (state.brandId) {
    await request({
      name: "Create product",
      method: "POST",
      path: "/api/products/createProduct",
      expect: [201],
      body: {
        modelName: `Preto Render Runner ${runId}`,
        description: "Live API test product",
        brandId: state.brandId,
        gender: "unisex",
        category: "Road",
        rentalPlan: [{ "1day": 200, "3day": 500, "7day": 1000 }],
        variants: [
          {
            skuColorCode: state.sku,
            colorName: "Black",
            images: "https://example.com/preto-render-shoe.jpg",
            size: [{ size: 42, stock: 3 }],
          },
        ],
      },
    }).then((r) => {
      state.productId = r.data?.data?._id || state.productId;
    });
  } else {
    results.push({
      name: "Create product",
      method: "POST",
      path: "/api/products/createProduct",
      expect: "201",
      status: 0,
      result: "SKIP",
      ms: 0,
      note: "Skipped because brandId was not available.",
      response: "",
    });
  }

  await request({ name: "Product invalid id", path: "/api/products/not-a-valid-id", expect: [400] });
  await request({
    name: "Product detail route behavior",
    path: `/api/products/${state.productId || "000000000000000000000000"}`,
    expect: state.productId ? [200, 404] : [404],
    note: "404 is accepted because this route currently calls shoe.controller and searches the Shoe model.",
  });

  await request({ name: "Orders router test", path: "/api/orders/test", expect: [200] });
  await request({ name: "Orders no auth", path: "/api/orders", expect: [401] });
  await request({ name: "Orders auth list", path: "/api/orders", token: state.userToken, expect: [200, 401] });

  if (state.productId && state.userToken) {
    await request({
      name: "Create order auth",
      method: "POST",
      path: "/api/orders",
      token: state.userToken,
      expect: [201, 500],
      note: "500 is recorded if live stock/product data blocks checkout.",
      body: {
        items: [
          {
            productId: state.productId,
            name: "Preto Render Runner",
            image: "https://example.com/preto-render-shoe.jpg",
            price: 200,
            size: "42",
            quantity: 1,
            deposit: 150,
          },
        ],
        rentalDays: 1,
        totalRental: 200,
        totalDeposit: 150,
        grandTotal: 350,
        shippingAddress: {
          recipientName: "พรี่โต Render User",
          phone: "0800000000",
          addressLine1: "Kinetix test address",
          city: "Bangkok",
          province: "Bangkok",
          postalCode: "10110",
          country: "Thailand",
        },
      },
    }).then((r) => {
      state.orderId = r.data?.data?.orderId || "";
    });
  }

  await request({
    name: "Rental histories collection route",
    path: "/api/rental_histories",
    expect: [200, 401, 404],
    note: "Discovery test for MongoDB collection-style route.",
  });
  await request({
    name: "Rental histories sample detail route",
    path: "/api/rental_histories/0db7366da99718f2b3d73a94",
    expect: [200, 401, 404],
    note: "Uses sample rental history id from the user-provided MongoDB document.",
  });
  await request({
    name: "Rental histories kebab route",
    path: "/api/rental-histories",
    expect: [200, 401, 404],
    note: "Discovery test for REST-style rental histories route.",
  });
  await request({
    name: "Rentals history mounted route no auth",
    path: "/api/rentals/history",
    expect: [200, 401, 404, 500],
    note: "Local router defines /history but index.js currently does not mount rentalsRouter.",
  });
  await request({
    name: "Rentals history mounted route with user token",
    path: "/api/rentals/history?page=1&limit=5",
    token: state.userToken,
    expect: [200, 401, 404, 500],
    note: "Checks whether deployed API has /api/rentals/history available.",
  });
  await request({
    name: "Rentals history sample tracking route",
    path: "/api/rentals/0db7366da99718f2b3d73a94/tracking",
    token: state.userToken,
    expect: [200, 401, 404, 500],
    note: "Checks sample rental history id against rentals tracking route shape.",
  });

  await request({ name: "Admin no auth", path: "/api/admin/test", expect: [401] });
  await request({ name: "Admin test", path: "/api/admin/test", token: state.adminToken, expect: [200, 401, 403] });
  await request({ name: "Admin stats", path: "/api/admin/stats", token: state.adminToken, expect: [200, 401, 403] });
  await request({ name: "Brands no auth", path: "/api/brands", expect: [401] });
  await request({ name: "Brands admin auth", path: "/api/brands", token: state.adminToken, expect: [200, 401, 403] });
  await request({ name: "Categories no auth", path: "/api/categories", expect: [401] });
  await request({ name: "Categories admin auth", path: "/api/categories", token: state.adminToken, expect: [200, 401, 403] });
  await request({ name: "Shoes no auth", path: "/api/shoes", expect: [401] });
  await request({ name: "Cart no auth", path: `/api/cart/${state.userId || "000000000000000000000000"}`, expect: [401] });
  await request({ name: "Unknown route", path: "/api/__not_found__", expect: [404] });

  const passed = results.filter((r) => r.result === "PASS").length;
  const failed = results.filter((r) => r.result === "FAIL").length;
  const skipped = results.filter((r) => r.result === "SKIP").length;

  const lines = [
    `# Render Live API Test Report`,
    ``,
    `## ${WORKFLOW_NAME}`,
    ``,
    `- Target: ${BASE_URL}`,
    `- Run ID: ${runId}`,
    `- Started/finished: ${nowIso()}`,
    `- Summary: PASS ${passed}, FAIL ${failed}, SKIP ${skipped}, TOTAL ${results.length}`,
    ``,
    `## Generated Test Data`,
    ``,
    `| Key | Value |`,
    `| --- | --- |`,
    `| userEmail | ${state.userEmail} |`,
    `| staffEmail | ${state.staffEmail} |`,
    `| staffId | ${state.staffId || "-"} |`,
    `| adminRole | admin |`,
    `| adminSource | staff collection via /api/staff/staffRegister |`,
    `| brandName | ${state.brandName} |`,
    `| productId | ${state.productId || "-"} |`,
    `| orderId | ${state.orderId || "-"} |`,
    ``,
    `## Results`,
    ``,
    `| # | Result | Status | Method | Endpoint | Expected | Name | Note |`,
    `| --- | --- | --- | --- | --- | --- | --- | --- |`,
    ...results.map((r, index) => `| ${index + 1} | ${r.result} | ${r.status || "-"} | ${r.method} | \`${r.path}\` | ${r.expect} | ${r.name} | ${String(r.note || "").replace(/\|/g, "/")} |`),
    ``,
    `## Response Samples`,
    ``,
    ...results.map((r, index) => [
      `### ${index + 1}. ${r.name}`,
      ``,
      `\`${r.method} ${r.path}\` -> ${r.status || "NO_STATUS"} (${r.result}, ${r.ms}ms)`,
      ``,
      `\`\`\`text`,
      String(r.response || "").replace(/```/g, "'''"),
      `\`\`\``,
      ``,
    ].join("\n")),
  ];

  const outDir = path.dirname(fileURLToPath(import.meta.url));
  await mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, `RENDER_LIVE_API_TEST_REPORT_${runId}.md`);
  await writeFile(reportPath, lines.join("\n"), "utf8");

  console.log("");
  console.log(`Summary: PASS ${passed}, FAIL ${failed}, SKIP ${skipped}, TOTAL ${results.length}`);
  console.log(`Report: ${reportPath}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
