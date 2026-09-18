process.env.NODE_ENV = "test";

const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

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
        "/api/admin/users",
        "/api/admin/audit",
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

test("regular admins cannot manage other admin accounts", async() => {
    const response = await fetch(`${apiUrl}/api/admin/users`, {
        headers: { Cookie: adminCookie },
    });
    assert.equal(response.status, 403);
});

test("super admin can view the database-backed admin registry", async() => {
    const token = jwt.sign({ username: "test-owner", role: "super_admin" }, process.env.JWT_SECRET);
    const response = await fetch(`${apiUrl}/api/admin/users`, {
        headers: { Cookie: `admin_token=${token}` },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.maxActiveAdmins, 3);
    assert.ok(body.users.some((user) => user.role === "super_admin"));
    assert.ok(body.users.every((user) => !Object.hasOwn(user, "password_hash")));
});

test("admin account creation validates credentials before writing", async() => {
    const token = jwt.sign({ username: "test-owner", role: "super_admin" }, process.env.JWT_SECRET);
    const response = await fetch(`${apiUrl}/api/admin/users`, {
        method: "POST",
        headers: { Cookie: `admin_token=${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "A", username: "!", password: "short" }),
    });

    assert.equal(response.status, 400);
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
    assert.match(validateProductUpdate({ imageUrl: "javascript:alert(1)" }), /güvenli/);
    assert.equal(validateProductUpdate({ imageUrl: "/product-images/dell-r750.webp" }), null);
    assert.match(validateProductUpdate({ imageUrl: "/uploads/unsafe.svg" }), /güvenli/);
    assert.match(validateProductUpdate({ imageUrl: "/product-images/../secret" }), /güvenli/);
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

test("product delete endpoints validate ids", async() => {
    const response = await fetch(
        `${apiUrl}/api/admin/products/not-a-uuid`,
        { method: "DELETE", headers: { Cookie: adminCookie } }
    );
    assert.equal(response.status, 400);

    const imageResponse = await fetch(
        `${apiUrl}/api/admin/products/not-a-uuid/image`,
        { method: "DELETE", headers: { Cookie: adminCookie } }
    );
    assert.equal(imageResponse.status, 400);
});

test("admin can upload, replace, remove and safely clean local product images", async() => {
    const categoryResult = await pool.query("SELECT id FROM categories ORDER BY path ASC LIMIT 1");
    const productDirectory = path.resolve(__dirname, "../uploads/products");
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9]);
    let createdId;
    const createdFiles = new Set();

    const filePathForUrl = (imageUrl) => path.join(productDirectory, path.basename(imageUrl));

    try {
        const createForm = new FormData();
        createForm.set("name", "Codex görsel yaşam döngüsü testi");
        createForm.set("brand", "Test");
        createForm.set("description", "Test tamamlanınca silinir.");
        createForm.set("stockQuantity", "2");
        createForm.set("categoryId", categoryResult.rows[0].id);
        createForm.set("image", new Blob([png], { type: "image/png" }), "../unsafe-name.png");

        const createResponse = await fetch(`${apiUrl}/api/admin/products`, {
            method: "POST",
            headers: { Cookie: adminCookie },
            body: createForm,
        });
        const createBody = await createResponse.json();
        createdId = createBody.product && createBody.product.id;

        assert.equal(createResponse.status, 201, JSON.stringify(createBody));
        assert.match(createBody.product.image_url, /^\/uploads\/products\/[0-9a-f-]{36}\.png$/);
        createdFiles.add(filePathForUrl(createBody.product.image_url));
        assert.equal((await fs.stat(filePathForUrl(createBody.product.image_url))).isFile(), true);

        const publicImageResponse = await fetch(`${apiUrl}${createBody.product.image_url}`);
        assert.equal(publicImageResponse.status, 200);
        assert.equal(publicImageResponse.headers.get("content-type"), "image/png");
        assert.equal(publicImageResponse.headers.get("x-content-type-options"), "nosniff");

        const updateForm = new FormData();
        updateForm.set("image", new Blob([jpeg], { type: "image/jpeg" }), "replacement.jpg");
        const updateResponse = await fetch(`${apiUrl}/api/admin/products/${createdId}`, {
            method: "PATCH",
            headers: { Cookie: adminCookie },
            body: updateForm,
        });
        const updateBody = await updateResponse.json();
        assert.equal(updateResponse.status, 200);
        assert.match(updateBody.product.image_url, /^\/uploads\/products\/[0-9a-f-]{36}\.jpg$/);
        createdFiles.add(filePathForUrl(updateBody.product.image_url));
        await assert.rejects(fs.stat(filePathForUrl(createBody.product.image_url)), { code: "ENOENT" });

        const imageDeleteResponse = await fetch(`${apiUrl}/api/admin/products/${createdId}/image`, {
            method: "DELETE",
            headers: { Cookie: adminCookie },
        });
        assert.equal(imageDeleteResponse.status, 200);
        await assert.rejects(fs.stat(filePathForUrl(updateBody.product.image_url)), { code: "ENOENT" });

        const finalImageForm = new FormData();
        finalImageForm.set("image", new Blob([png], { type: "image/png" }), "final.png");
        const finalImageResponse = await fetch(`${apiUrl}/api/admin/products/${createdId}`, {
            method: "PATCH",
            headers: { Cookie: adminCookie },
            body: finalImageForm,
        });
        const finalImageBody = await finalImageResponse.json();
        createdFiles.add(filePathForUrl(finalImageBody.product.image_url));
        assert.equal(finalImageResponse.status, 200);

        const productDeleteResponse = await fetch(`${apiUrl}/api/admin/products/${createdId}`, {
            method: "DELETE",
            headers: { Cookie: adminCookie },
        });
        assert.equal(productDeleteResponse.status, 200);
        await assert.rejects(fs.stat(filePathForUrl(finalImageBody.product.image_url)), { code: "ENOENT" });
        createdId = null;
    } finally {
        if (createdId) await pool.query("DELETE FROM products WHERE id = $1", [createdId]);
        await Promise.all([...createdFiles].map((filePath) => fs.unlink(filePath).catch(() => {})));
    }
});

test("image upload rejects spoofed content and leaves no file behind", async() => {
    const before = new Set(await fs.readdir(path.resolve(__dirname, "../uploads/products")));
    const form = new FormData();
    form.set("image", new Blob(["not a png"], { type: "image/png" }), "fake.png");

    const response = await fetch(
        `${apiUrl}/api/admin/products/00000000-0000-4000-8000-000000000000`,
        { method: "PATCH", headers: { Cookie: adminCookie }, body: form }
    );
    const afterFiles = await fs.readdir(path.resolve(__dirname, "../uploads/products"));

    assert.equal(response.status, 400);
    assert.deepEqual(new Set(afterFiles), before);
});

test("image upload enforces the 5 MB size limit", async() => {
    const uploadDirectory = path.resolve(__dirname, "../uploads/products");
    const before = new Set(await fs.readdir(uploadDirectory));
    const oversizedPng = Buffer.alloc((5 * 1024 * 1024) + 1);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(oversizedPng);
    const form = new FormData();
    form.set("image", new Blob([oversizedPng], { type: "image/png" }), "too-large.png");

    const response = await fetch(
        `${apiUrl}/api/admin/products/00000000-0000-4000-8000-000000000000`,
        { method: "PATCH", headers: { Cookie: adminCookie }, body: form }
    );
    const body = await response.json();
    const afterFiles = await fs.readdir(uploadDirectory);

    assert.equal(response.status, 400);
    assert.match(body.message, /5 MB/);
    assert.deepEqual(new Set(afterFiles), before);
});

test("credentialed CORS rejects unknown browser origins", async() => {
    const response = await fetch(`${apiUrl}/api/admin/categories`, {
        headers: { Origin: "https://attacker.example", Cookie: adminCookie },
    });
    assert.equal(response.status, 403);
});


test("security headers are present", async() => {
    const response = await fetch(apiUrl + "/");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.ok(response.headers.get("content-security-policy"));
});

test("password change requires an authenticated admin", async() => {
    const response = await fetch(apiUrl + "/api/admin/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: "old-password", newPassword: "new-password-123" }),
    });
    assert.equal(response.status, 401);
});

test("category delete validates ids without touching catalog data", async() => {
    const response = await fetch(apiUrl + "/api/admin/categories/not-a-uuid", {
        method: "DELETE",
        headers: { Cookie: adminCookie },
    });
    assert.equal(response.status, 400);
});

test("super admin can read the audit log", async() => {
    const token = jwt.sign({ username: "test-owner", role: "super_admin" }, process.env.JWT_SECRET);
    const response = await fetch(apiUrl + "/api/admin/audit?limit=5", {
        headers: { Cookie: "admin_token=" + token },
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.events));
});
