const pool = require("../config/db");
const { randomUUID } = require("node:crypto");

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EDITABLE_FIELDS = new Set([
    "name",
    "brand",
    "description",
    "imageUrl",
    "stockQuantity",
    "categoryId",
]);

const slugify = (value) => value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 400) || "urun";

const availabilityForStock = (stockQuantity) => (
    stockQuantity === 0
        ? "OUT_OF_STOCK"
        : stockQuantity <= 5
            ? "LOW_STOCK"
            : "IN_STOCK"
);

const validateProductUpdate = (body) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return "Geçerli bir ürün bilgisi gönderilmelidir.";
    }

    const fields = Object.keys(body);

    if (fields.length === 0) {
        return "Güncellenecek en az bir alan gönderilmelidir.";
    }

    if (fields.some((field) => !EDITABLE_FIELDS.has(field))) {
        return "Gönderilen alanlardan biri güncellenemez.";
    }

    if (
        Object.hasOwn(body, "name") &&
        (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 400)
    ) {
        return "Ürün adı 2 ile 400 karakter arasında olmalıdır.";
    }

    if (
        Object.hasOwn(body, "brand") &&
        (typeof body.brand !== "string" || body.brand.trim().length < 1 || body.brand.trim().length > 200)
    ) {
        return "Marka 1 ile 200 karakter arasında olmalıdır.";
    }

    if (
        Object.hasOwn(body, "description") &&
        body.description !== null &&
        typeof body.description !== "string"
    ) {
        return "Açıklama metin veya boş olmalıdır.";
    }

    if (
        Object.hasOwn(body, "imageUrl") &&
        body.imageUrl !== null &&
        (typeof body.imageUrl !== "string" || body.imageUrl.trim().length > 2048)
    ) {
        return "Görsel adresi en fazla 2048 karakter olmalıdır.";
    }

    if (Object.hasOwn(body, "imageUrl") && body.imageUrl) {
        const imageUrl = body.imageUrl.trim();
        const isRemoteUrl = /^https?:\/\//i.test(imageUrl);
        const isLocalPath = /^\/product-images\/[a-z0-9][a-z0-9._/-]*$/i.test(imageUrl) &&
            !imageUrl.split("/").some((segment) => segment === "." || segment === "..");

        if (!isRemoteUrl && !isLocalPath) {
            return "Görsel adresi http(s) veya /product-images/ ile başlayan güvenli bir yerel yol olmalıdır.";
        }
    }

    if (
        Object.hasOwn(body, "stockQuantity") &&
        (!Number.isInteger(body.stockQuantity) || body.stockQuantity < 0 || body.stockQuantity > 1000000)
    ) {
        return "Stok miktarı 0 ile 1.000.000 arasında tam sayı olmalıdır.";
    }

    if (
        Object.hasOwn(body, "categoryId") &&
        (typeof body.categoryId !== "string" || !UUID_PATTERN.test(body.categoryId))
    ) {
        return "Geçerli bir kategori seçilmelidir.";
    }

    return null;
};

const validateProductCreate = (body) => {
    const validationError = validateProductUpdate(body);

    if (validationError) return validationError;

    const requiredFields = ["name", "brand", "stockQuantity", "categoryId"];
    if (requiredFields.some((field) => !Object.hasOwn(body, field))) {
        return "Ürün adı, marka, stok miktarı ve kategori zorunludur.";
    }

    return null;
};

exports.createProduct = async(req, res) => {
    const validationError = validateProductCreate(req.body);

    if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
    }

    let client;

    try {
        client = await pool.connect();
        await client.query("BEGIN");

        const categoryResult = await client.query(
            "SELECT id, name FROM categories WHERE id = $1",
            [req.body.categoryId]
        );

        if (categoryResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "Seçilen kategori bulunamadı.",
            });
        }

        const id = randomUUID();
        const category = categoryResult.rows[0];
        const name = req.body.name.trim();
        const stockQuantity = req.body.stockQuantity;
        const slug = `${slugify(name)}-${id.slice(0, 8)}`;

        const result = await client.query(
            `
                INSERT INTO products (
                    id, source_key, external_id, name, slug, category, brand,
                    description, image_url, availability, stock_quantity,
                    source_url, created_at, updated_at, category_id
                )
                VALUES (
                    $1::uuid, 'admin', $1::text, $2, $3, $4, $5, $6, $7, $8, $9,
                    $10, NOW(), NOW(), $11
                )
                RETURNING id, name, slug, brand, description, image_url,
                          availability, stock_quantity, category_id, created_at, updated_at
            `,
            [
                id,
                name,
                slug,
                category.name,
                req.body.brand.trim(),
                req.body.description ? req.body.description.trim() || null : null,
                req.body.imageUrl ? req.body.imageUrl.trim() || null : null,
                availabilityForStock(stockQuantity),
                stockQuantity,
                `admin://products/${id}`,
                category.id,
            ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Ürün eklendi.",
            product: { ...result.rows[0], category_name: category.name },
        });
    } catch (error) {
        if (client) await client.query("ROLLBACK").catch(() => {});
        console.error("Admin product create error:", error);
        return res.status(500).json({ success: false, message: "Ürün eklenemedi." });
    } finally {
        if (client) client.release();
    }
};

exports.getProducts = async(req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit) || 20, 1),
            100
        );

        const search = (req.query.search || "").trim();
        const offset = (page - 1) * limit;

        const params = [];
        let whereClause = "";

        if (search) {
            params.push(`%${search}%`);

            whereClause = `
        WHERE
          p.name ILIKE $1
          OR p.slug ILIKE $1
          OR p.brand ILIKE $1
      `;
        }

        const countParams = [...params];

        params.push(limit);
        const limitIndex = params.length;

        params.push(offset);
        const offsetIndex = params.length;

        const productsQuery = `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.brand,
        p.description,
        p.stock_quantity,
        p.availability,
        p.image_url,
        p.category_id,
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      ${whereClause}
      ORDER BY p.id DESC
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
    `;

        const countQuery = `
      SELECT COUNT(*) AS total
      FROM products p
      ${whereClause}
    `;

        const [productsResult, countResult] = await Promise.all([
            pool.query(productsQuery, params),
            pool.query(countQuery, countParams),
        ]);

        const total = Number(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        return res.json({
            success: true,

            pagination: {
                page,
                limit,
                total,
                totalPages,
            },

            products: productsResult.rows,
        });
    } catch (error) {
        console.error("Admin products error:", error);

        return res.status(500).json({
            success: false,
            message: "Ürünler alınamadı.",
        });
    }
};

exports.updateProduct = async(req, res) => {
    const { id } = req.params;

    if (!UUID_PATTERN.test(id)) {
        return res.status(400).json({
            success: false,
            message: "Geçerli bir ürün kimliği gönderilmelidir.",
        });
    }

    const validationError = validateProductUpdate(req.body);

    if (validationError) {
        return res.status(400).json({
            success: false,
            message: validationError,
        });
    }

    let client;

    try {
        client = await pool.connect();
        await client.query("BEGIN");

        let category = null;

        if (Object.hasOwn(req.body, "categoryId")) {
            const categoryResult = await client.query(
                "SELECT id, name FROM categories WHERE id = $1",
                [req.body.categoryId]
            );

            if (categoryResult.rowCount === 0) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message: "Seçilen kategori bulunamadı.",
                });
            }

            category = categoryResult.rows[0];
        }

        const assignments = [];
        const values = [];
        const addAssignment = (column, value) => {
            values.push(value);
            assignments.push(`${column} = $${values.length}`);
        };

        if (Object.hasOwn(req.body, "name")) addAssignment("name", req.body.name.trim());
        if (Object.hasOwn(req.body, "brand")) addAssignment("brand", req.body.brand.trim());
        if (Object.hasOwn(req.body, "description")) {
            addAssignment("description", req.body.description ? req.body.description.trim() || null : null);
        }
        if (Object.hasOwn(req.body, "imageUrl")) {
            addAssignment("image_url", req.body.imageUrl ? req.body.imageUrl.trim() || null : null);
        }
        if (Object.hasOwn(req.body, "stockQuantity")) {
            addAssignment("stock_quantity", req.body.stockQuantity);
            addAssignment("availability", availabilityForStock(req.body.stockQuantity));
        }
        if (category) {
            addAssignment("category_id", category.id);
            addAssignment("category", category.name);
        }

        assignments.push("updated_at = NOW()");
        values.push(id);

        const result = await client.query(
            `
                UPDATE products
                SET ${assignments.join(", ")}
                WHERE id = $${values.length}
                RETURNING id, name, slug, brand, description, image_url,
                          availability, stock_quantity, category_id, updated_at
            `,
            values
        );

        if (result.rowCount === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Ürün bulunamadı.",
            });
        }

        await client.query("COMMIT");

        return res.json({
            success: true,
            message: "Ürün güncellendi.",
            product: {
                ...result.rows[0],
                category_name: category ? category.name : undefined,
            },
        });
    } catch (error) {
        if (client) {
            await client.query("ROLLBACK").catch(() => {});
        }
        console.error("Admin product update error:", error);

        return res.status(500).json({
            success: false,
            message: "Ürün güncellenemedi.",
        });
    } finally {
        if (client) {
            client.release();
        }
    }
};

exports.validateProductUpdate = validateProductUpdate;
exports.validateProductCreate = validateProductCreate;
