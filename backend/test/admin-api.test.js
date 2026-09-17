const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("node:crypto");

const app = require("../src/app");
const pool = require("../src/config/db");
const {
    validateProductCreate,
    validateProductUpdate,
} = require("../src/controllers/adminProductsController");

let server;
let apiUrl;
let adminCookie;
let databaseSnapshot;
let categorySnapshot;

before(async() => {
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));

    const address = server.address();
    apiUrl = `http://127.0.0.1:${address.port}`;
    const token = jwt.sign({ username: "test-admin", role: "admin" }, process.env.JWT_SECRET, {
        expiresIn: "5m",
    });
    adminCookie = `admin_token=${token}`;

    const result = await pool.query(
        "SELECT COUNT(*)::integer AS count, MAX(updated_at) AS latest_update FROM products"
    );
    databaseSnapshot = result.rows[0];
    const categoryResult = await pool.query(
        "SELECT COUNT(*)::integer AS count, MD5(STRING_AGG(id::text || ':' || path, ',' ORDER BY id)) AS digest FROM categories"
    );
    categorySnapshot = categoryResult.rows[0];
});

after(async() => {
    const result = await pool.query(
        "SELECT COUNT(*)::integer AS count, MAX(updated_at) AS latest_update FROM products"
    );

    assert.equal(result.rows[0].count, databaseSnapshot.count);
    assert.equal(
        result.rows[0].latest_update.toISOString(),
        databaseSnapshot.latest_update.toISOString(),
        "Güvenlik testleri ürün verisini değiştirmemeli"
    );

    const categories = await pool.query(
        "SELECT COUNT(*)::integer AS count, MD5(STRING_AGG(id::text || ':' || path, ',' ORDER BY id)) AS digest FROM categories"
    );
    assert.deepEqual(categories.rows[0], categorySnapshot, "Testler gerçek kategori verisini değiştirmemeli");

    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await pool.end();
});

test("admin categories rejects unauthenticated requests", async() => {
    const response = await fetch(`${apiUrl}/api/admin/categories`);
    assert.equal(response.status, 401);
});

test("all protected admin reads reject unauthenticated requests", async() => {
    const paths = [
        "/api/admin/auth/me",
        "/api/admin/dashboard/stats",
        "/api/admin/products",
    ];

    for (const path of paths) {
        const response = await fetch(`${apiUrl}${path}`);
        assert.equal(response.status, 401, path);
    }
});

test("admin middleware rejects a signed non-admin role", async() => {
    const token = jwt.sign({ username: "test-user", role: "viewer" }, process.env.JWT_SECRET);
    const response = await fetch(`${apiUrl}/api/admin/products`, {
        headers: { Cookie: `admin_token=${token}` },
    });
    assert.equal(response.status, 403);
});

test("logout expires the admin cookie", async() => {
    const response = await fetch(`${apiUrl}/api/admin/auth/logout`, {
        method: "POST",
        headers: { Cookie: adminCookie },
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("set-cookie"), /admin_token=;/);
});

test("admin product update rejects unauthenticated requests", async() => {
    const response = await fetch(
        `${apiUrl}/api/admin/products/00000000-0000-4000-8000-000000000000`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stockQuantity: 1 }),
        }
    );
    assert.equal(response.status, 401);
});

test("admin product create rejects unauthenticated requests", async() => {
    const response = await fetch(`${apiUrl}/api/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
    });
    assert.equal(response.status, 401);
});

test("admin category writes reject unauthenticated requests", async() => {
    const createResponse = await fetch(`${apiUrl}/api/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Yetkisiz test" }),
    });
    assert.equal(createResponse.status, 401);

    const updateResponse = await fetch(
        `${apiUrl}/api/admin/categories/00000000-0000-4000-8000-000000000000`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Yetkisiz test" }),
        }
    );
    assert.equal(updateResponse.status, 401);
});

test("admin categories returns the PostgreSQL category list", async() => {
    const response = await fetch(`${apiUrl}/api/admin/categories`, {
        headers: { Cookie: adminCookie },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.count > 0);
    assert.equal(body.categories.length, body.count);
    assert.equal(typeof body.categories[0].product_count, "number");
});

test("product listing safely handles SQL-like search text", async() => {
    const params = new URLSearchParams({ search: "%' OR 1=1 --", limit: "5" });
    const response = await fetch(`${apiUrl}/api/admin/products?${params}`, {
        headers: { Cookie: adminCookie },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.products.length <= 5);
});

test("public catalog supports search, sorting and pagination", async() => {
    const params = new URLSearchParams({ q: "server", sort: "name-desc", page: "1", limit: "6" });
    const response = await fetch(`${apiUrl}/api/products?${params}`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
    assert.ok(body.products.length <= 6);
    assert.equal(body.pagination.page, 1);
    assert.ok(Array.isArray(body.brands));
});

test("public categories expose direct and descendant product counts", async() => {
    const response = await fetch(`${apiUrl}/api/categories`);
    const body = await response.json();
    const parent = body.categories.find((category) =>
        category.parent_id === null && category.product_count > category.direct_product_count
    );

    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
    assert.ok(parent, "En az bir üst kategori alt kategori ürünlerini kapsamalı");

    const detailResponse = await fetch(`${apiUrl}/api/categories/${parent.slug}`);
    const detailBody = await detailResponse.json();
    assert.equal(detailResponse.status, 200);
    assert.equal(detailBody.category.id, parent.id);
    assert.equal(detailBody.category.product_count, parent.product_count);
});

test("network catalog has its canonical route and descendant products", async() => {
    const categoriesResponse = await fetch(`${apiUrl}/api/categories`);
    const categoriesBody = await categoriesResponse.json();
    const network = categoriesBody.categories.find((category) =>
        category.parent_id === null && category.slug === "network-ekipmanlari"
    );

    assert.equal(categoriesResponse.status, 200);
    assert.ok(network, "Network ana kategorisinin kalıcı adresi bulunmalı");
    assert.ok(network.product_count > 0, "Network kategorisi alt kategori ürünlerini kapsamalı");

    const productsResponse = await fetch(`${apiUrl}/api/products?categoryId=${network.id}&limit=5`);
    const productsBody = await productsResponse.json();

    assert.equal(productsResponse.status, 200);
    assert.equal(productsBody.pagination.total, network.product_count);
    assert.ok(productsBody.products.length > 0);
    assert.ok(productsBody.products.every((product) => product.category_path.startsWith(network.path)));
});

test("parent category filter includes products assigned to descendants", async() => {
    const categoriesResponse = await fetch(`${apiUrl}/api/categories`);
    const categoriesBody = await categoriesResponse.json();
    const parent = categoriesBody.categories.find((category) =>
        category.parent_id === null && category.direct_product_count === 0 && category.product_count > 0
    );
    const response = await fetch(`${apiUrl}/api/products?categoryId=${parent.id}&limit=5`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.pagination.total, parent.product_count);
    assert.ok(body.products.length > 0);
    assert.ok(body.products.every((product) => product.category_path.startsWith(parent.path)));
});

test("public catalog search handles Turkish dotted and dotless i", async() => {
    const response = await fetch(`${apiUrl}/api/products?q=${encodeURIComponent("işlemci")}&limit=1`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
    assert.ok(body.pagination.total > 0);
});

test("public product detail validates ids", async() => {
    const response = await fetch(`${apiUrl}/api/products/not-a-uuid`);
    assert.equal(response.status, 400);
});

test("product update validates id and payload before querying", async() => {
    const invalidIdResponse = await fetch(`${apiUrl}/api/admin/products/not-a-uuid`, {
        method: "PATCH",
        headers: { Cookie: adminCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ stockQuantity: 1 }),
    });
    assert.equal(invalidIdResponse.status, 400);

    const invalidPayloadResponse = await fetch(
        `${apiUrl}/api/admin/products/00000000-0000-4000-8000-000000000000`,
        {
            method: "PATCH",
            headers: { Cookie: adminCookie, "Content-Type": "application/json" },
            body: JSON.stringify({ stockQuantity: -1 }),
        }
    );
    assert.equal(invalidPayloadResponse.status, 400);
});

test("product update is compatible with the live PostgreSQL schema", async() => {
    const id = randomUUID();
    const categoryResult = await pool.query(
        "SELECT id, name FROM categories ORDER BY path ASC LIMIT 1"
    );
    const category = categoryResult.rows[0];

    await pool.query(
        `
            INSERT INTO products (
                id, source_key, external_id, name, slug, category, brand,
                description, image_url, availability, stock_quantity,
                source_url, created_at, updated_at, category_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NULL,
                    'OUT_OF_STOCK', 0, $8, NOW(), NOW(), $9)
        `,
        [
            id,
            `codex-test-${id}`,
            `codex-test-${id}`,
            "Codex geçici test ürünü",
            `codex-test-${id}`,
            category.name,
            "Test",
            "https://example.invalid/test-product",
            category.id,
        ]
    );

    try {
        const response = await fetch(`${apiUrl}/api/admin/products/${id}`, {
            method: "PATCH",
            headers: { Cookie: adminCookie, "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Codex güncellenmiş test ürünü",
                brand: "Test Markası",
                description: "Yalnızca otomatik entegrasyon testi için oluşturuldu.",
                imageUrl: "https://example.invalid/product.webp",
                stockQuantity: 3,
                categoryId: category.id,
            }),
        });
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.success, true);
        assert.equal(body.product.availability, "LOW_STOCK");
        assert.equal(body.product.stock_quantity, 3);
        assert.equal(body.product.category_name, category.name);
    } finally {
        await pool.query("DELETE FROM products WHERE id = $1 AND source_key = $2", [
            id,
            `codex-test-${id}`,
        ]);
    }
});

test("product create is compatible with the live PostgreSQL schema", async() => {
    const categoryResult = await pool.query(
        "SELECT id FROM categories ORDER BY path ASC LIMIT 1"
    );
    let createdId;

    try {
        const response = await fetch(`${apiUrl}/api/admin/products`, {
            method: "POST",
            headers: { Cookie: adminCookie, "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Codex geçici ekleme testi",
                brand: "Test",
                description: "Test tamamlanınca otomatik silinir.",
                imageUrl: "https://example.invalid/create.webp",
                stockQuantity: 8,
                categoryId: categoryResult.rows[0].id,
            }),
        });
        const body = await response.json();
        createdId = body.product && body.product.id;

        assert.equal(response.status, 201);
        assert.equal(body.success, true);
        assert.equal(body.product.availability, "IN_STOCK");

        const stored = await pool.query(
            "SELECT source_key, stock_quantity FROM products WHERE id = $1",
            [createdId]
        );
        assert.equal(stored.rows[0].source_key, "admin");
        assert.equal(stored.rows[0].stock_quantity, 8);
    } finally {
        if (createdId) {
            await pool.query("DELETE FROM products WHERE id = $1 AND source_key = 'admin'", [createdId]);
        }
    }
});

test("product validation rejects unknown and unsafe values", () => {
    assert.match(validateProductUpdate({ sourceUrl: "https://example.com" }), /güncellenemez/);
    assert.match(validateProductUpdate({ imageUrl: "javascript:alert(1)" }), /http\(s\)/);
    assert.equal(validateProductUpdate({ imageUrl: "/product-images/dell-r750.webp" }), null);
    assert.match(validateProductUpdate({ imageUrl: "/uploads/unsafe.svg" }), /product-images/);
    assert.match(validateProductUpdate({ imageUrl: "/product-images/../secret" }), /product-images/);
    assert.match(validateProductUpdate({ name: " " }), /2 ile 400/);
    assert.equal(validateProductUpdate({ stockQuantity: 0 }), null);
    assert.match(validateProductCreate({ name: "Test" }), /zorunludur/);
});

test("category create and update preserve the hierarchy in PostgreSQL", async() => {
    const suffix = randomUUID().slice(0, 8);
    let parentId;
    let childId;

    try {
        const parentResponse = await fetch(`${apiUrl}/api/admin/categories`, {
            method: "POST",
            headers: { Cookie: adminCookie, "Content-Type": "application/json" },
            body: JSON.stringify({ name: `Codex Test ${suffix}`, parentId: null }),
        });
        const parentBody = await parentResponse.json();
        parentId = parentBody.category && parentBody.category.id;
        assert.equal(parentResponse.status, 201);

        const childResponse = await fetch(`${apiUrl}/api/admin/categories`, {
            method: "POST",
            headers: { Cookie: adminCookie, "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Geçici Alt", parentId }),
        });
        const childBody = await childResponse.json();
        childId = childBody.category && childBody.category.id;
        assert.equal(childResponse.status, 201);
        assert.equal(childBody.category.path, `Codex Test ${suffix} > Geçici Alt`);

        const cycleResponse = await fetch(`${apiUrl}/api/admin/categories/${parentId}`, {
            method: "PATCH",
            headers: { Cookie: adminCookie, "Content-Type": "application/json" },
            body: JSON.stringify({ parentId: childId }),
        });
        assert.equal(cycleResponse.status, 400);

        const updateResponse = await fetch(`${apiUrl}/api/admin/categories/${parentId}`, {
            method: "PATCH",
            headers: { Cookie: adminCookie, "Content-Type": "application/json" },
            body: JSON.stringify({ name: `Codex Güncel ${suffix}`, parentId: null }),
        });
        assert.equal(updateResponse.status, 200);

        const storedChild = await pool.query("SELECT path FROM categories WHERE id = $1", [childId]);
        assert.equal(storedChild.rows[0].path, `Codex Güncel ${suffix} > Geçici Alt`);
    } finally {
        if (childId) await pool.query("DELETE FROM categories WHERE id = $1", [childId]);
        if (parentId) await pool.query("DELETE FROM categories WHERE id = $1", [parentId]);
    }
});

test("delete endpoint is intentionally unavailable", async() => {
    const response = await fetch(
        `${apiUrl}/api/admin/products/00000000-0000-4000-8000-000000000000`,
        { method: "DELETE", headers: { Cookie: adminCookie } }
    );
    assert.equal(response.status, 404);

    const categoryResponse = await fetch(
        `${apiUrl}/api/admin/categories/00000000-0000-4000-8000-000000000000`,
        { method: "DELETE", headers: { Cookie: adminCookie } }
    );
    assert.equal(categoryResponse.status, 404);
});

test("credentialed CORS rejects unknown browser origins", async() => {
    const response = await fetch(`${apiUrl}/api/admin/categories`, {
        headers: { Origin: "https://attacker.example", Cookie: adminCookie },
    });
    assert.equal(response.status, 403);
});
