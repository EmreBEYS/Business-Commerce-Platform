const fs = require("node:fs/promises");
const path = require("node:path");
const pool = require("../src/config/db");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const APPLY = process.argv.includes("--apply");
const PROJECT_ROOT = path.join(__dirname, "..", "..");
const ASSET_DIR = path.join(PROJECT_ROOT, "frontend", "public", "product-images", "official");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "docs", "product-image-sources.json");

const SOURCES = [
    {
        key: "hpe-proliant-dl380-gen10",
        filename: "hpe-proliant-dl380-gen10.png",
        categoryRoot: "Sunucular",
        namePattern: "(?:HP|HPE)\\s+(?:PROLIANT\\s+)?DL\\s*380\\s*GEN\\s*10(?:\\b|$)",
        sourcePage: "https://buy.hpe.com/us/en/compute/rack-servers/proliant-dl300-servers/hpe-proliant-dl380-gen10-server/p/1010026818",
        sourceImage: "https://assets.ext.hpe.com/is/image/hpedam/s00009709?$zoom$",
    },
    {
        key: "hpe-proliant-dl380-gen11",
        filename: "hpe-proliant-dl380-gen11.png",
        categoryRoot: "Sunucular",
        namePattern: "(?:HP|HPE)\\s+(?:PROLIANT\\s+)?DL\\s*380\\s*GEN\\s*11(?:\\b|$)",
        sourcePage: "https://buy.hpe.com/us/en/compute/rack-servers/proliant-dl300-servers/hpe-proliant-dl380-gen11/p/1014696069",
        sourceImage: "https://assets.ext.hpe.com/is/image/hpedam/s00011809?$zoom$",
    },
    {
        key: "hpe-proliant-dl360-gen10",
        filename: "hpe-proliant-dl360-gen10.png",
        categoryRoot: "Sunucular",
        namePattern: "(?:HP|HPE)\\s+(?:PROLIANT\\s+)?DL\\s*360\\s*GEN\\s*10(?:\\b|$)",
        sourcePage: "https://buy.hpe.com/us/en/servers/rack-servers/proliant-dl300-servers/proliant-dl360-server/hpe-proliant-dl360-gen10-server/p/1010007891",
        sourceImage: "https://assets.ext.hpe.com/is/image/hpedam/s00001312?$zoom$",
    },
    {
        key: "hpe-proliant-dl360-gen11",
        filename: "hpe-proliant-dl360-gen11.png",
        categoryRoot: "Sunucular",
        namePattern: "(?:HP|HPE)\\s+(?:PROLIANT\\s+)?DL\\s*360\\s*GEN\\s*11(?:\\b|$)",
        sourcePage: "https://buy.hpe.com/us/en/compute/rack-servers/proliant-dl300-servers/hpe-proliant-dl360-gen11/p/1014696065",
        sourceImage: "https://assets.ext.hpe.com/is/image/hpedam/s00011808?$zoom$",
    },
    {
        key: "amd-epyc-series",
        filename: "amd-epyc-series.jpg",
        previousLocalPaths: ["/product-images/official/amd-epyc-9655.jpg"],
        categoryRoot: "İşlemciler",
        namePattern: "AMD\\s+EPYC(?:™)?(?:\\s|$)",
        sourcePage: "https://www.amd.com/en/products/processors/server/epyc.html",
        sourceImage: "https://www.amd.com/content/dam/amd/en/images/products/data-centers/3847800-epyc-family-teaser.jpg",
    },
    {
        key: "amd-ryzen-series",
        filename: "amd-ryzen-series.jpg",
        categoryRoot: "İşlemciler > Ryzen™ Serisi",
        namePattern: "AMD\\s+RYZEN(?:™)?(?:\\s|$)",
        sourcePage: "https://www.amd.com/en/products/processors/desktops/ryzen.html",
        sourceImage: "https://www.amd.com/content/dam/amd/en/images/products/processors/ryzen/2613900-amd-ryzen-9000-desktop-og.jpg",
    },
    {
        key: "intel-xeon-series",
        filename: "intel-xeon-series.png",
        categoryRoot: "İşlemciler",
        namePattern: "INTEL(?:®)?\\s+XEON(?:®)?(?:\\s|$)",
        sourcePage: "https://www.intel.com/content/www/us/en/products/details/processors/xeon/4th-gen-xeon-scalable-processors.html",
        sourceImage: "https://www.intel.com/content/dam/www/central-libraries/us/en/images/2026-04/intel-xeon-logo-2020.png",
    },
    {
        key: "intel-core-ultra-series-2",
        filename: "intel-core-ultra-series-2.png",
        categoryRoot: "İşlemciler > Core™ Serisi",
        namePattern: "INTEL(?:®)?\\s+CORE(?:™)?\\s+ULTRA(?:\\s|$)",
        sourcePage: "https://www.intel.com/content/www/us/en/products/docs/processors/core-ultra/core-ultra-desktop-processors-series-2-brief.html",
        sourceImage: "https://www.intel.com/content/dam/www/central-libraries/us/en/images/2023-10/badges-core-ultra-processor-family-5-7-9-center.png",
    },
    {
        key: "intel-core-13th-gen",
        filename: "intel-core-13th-gen.jpg",
        categoryRoot: "İşlemciler > Core™ Serisi",
        namePattern: "INTEL(?:®)?\\s+CORE(?:™)?\\s+I[79]-13\\d+",
        sourcePage: "https://www.intel.com/content/www/us/en/newsroom/resources/13th-gen-core.html",
        sourceImage: "https://www.intel.com/content/dam/www/central-libraries/us/en/images/2022-09/newsroom-innovation-13th-gen-intel-core-1-feat.jpg",
    },
    {
        key: "dell-poweredge-r620",
        filename: "dell-poweredge-r620.jpg",
        categoryRoot: "Sunucular",
        namePattern: "DELL\\s+(?:POWEREDGE\\s+)?R\\s*620(?:\\b|$)",
        sourcePage: "https://www.dell.com/support/product-details/en-us/product/poweredge-r620/overview",
        sourceImage: "https://i.dell.com/das/dih.ashx/500x500/das/xa_____/global-site-design%20WEB/99ee13b8-15bb-6c79-4620-f088ca1884b8/1/OriginalJPG?id=Dell/Product_Images/Dell_Enterprise_Products/Enterprise_Systems/PowerEdge/Poweredge_R620/relative_size/server-poweredge-r620-front-relativesized-500.psd",
    },
    {
        key: "dell-poweredge-r630",
        filename: "dell-poweredge-r630.png",
        categoryRoot: "Sunucular",
        namePattern: "DELL\\s+(?:POWEREDGE\\s+)?R\\s*630(?:\\b|$)",
        sourcePage: "https://www.dell.com/support/product-details/en-us/product/poweredge-r630/overview",
        sourceImage: "https://i.dell.com/is/image/DellContent//content/dam/ss2/product-images/dell-enterprise-products/enterprise-systems/poweredge/poweredge-r630/global-spi/server-poweredge-r630-left-relativesize-500-ng.psd?fmt=png-alpha",
    },
    {
        key: "dell-poweredge-r640",
        filename: "dell-poweredge-r640.jpg",
        categoryRoot: "Sunucular",
        namePattern: "DELL\\s+(?:POWEREDGE\\s+)?R\\s*640(?:\\b|$)",
        sourcePage: "https://www.dell.com/support/product-details/en-us/product/poweredge-r640/overview",
        sourceImage: "https://i.dell.com/is/image/DellContent///content/dam/ss2/product-images/dell-enterprise-products/enterprise-systems/poweredge/r-series/r640/global-spi/enterprise-servers-poweredge-dellemc-per640-bezel-lcd-2-if-on-left-relativesize-500-ng.psd?fmt=png-alpha",
    },
    {
        key: "dell-poweredge-r730",
        filename: "dell-poweredge-r730.png",
        categoryRoot: "Sunucular",
        namePattern: "DELL\\s+(?:POWEREDGE\\s+)?R\\s*730(?!\\s*XD)(?:\\b|$)",
        sourcePage: "https://www.dell.com/support/product-details/en-us/product/poweredge-r730/overview",
        sourceImage: "https://i.dell.com/is/image/DellContent//content/dam/ss2/product-images/dell-enterprise-products/enterprise-systems/poweredge/poweredge-r730/global-spi/server-poweredge-r730-front-relativesize-500-ng-v2.psd?fmt=png-alpha",
    },
    {
        key: "dell-poweredge-r730xd",
        filename: "dell-poweredge-r730xd.png",
        categoryRoot: "Sunucular",
        namePattern: "DELL\\s+(?:POWEREDGE\\s+)?R\\s*730\\s*XD(?:\\b|$)",
        sourcePage: "https://www.dell.com/support/product-details/en-us/product/poweredge-r730xd/overview",
        sourceImage: "https://i.dell.com/is/image/DellContent//content/dam/ss2/product-images/dell-enterprise-products/networking-products/dell/mix-products/pdp/dellemc-vmware-virtual-san-ready-nodes-pdp.png?fmt=png-alpha",
    },
    {
        key: "dell-poweredge-r740",
        filename: "dell-poweredge-r740.jpg",
        categoryRoot: "Sunucular",
        namePattern: "DELL\\s+(?:POWEREDGE\\s+)?R\\s*740(?!\\s*XD)(?:\\b|$)",
        sourcePage: "https://www.dell.com/support/product-details/en-us/product/poweredge-r740/overview",
        sourceImage: "https://i.dell.com/is/image/DellContent//content/dam/ss2/product-images/dell-enterprise-products/enterprise-systems/poweredge/r-series/r740/global-spi/enterprise-servers-poweredge-dellemc-per740-dvd-lf-on-left-relativesize-500-ng.psd?fmt=png-alpha",
    },
    {
        key: "dell-poweredge-r740xd",
        filename: "dell-poweredge-r740xd.jpg",
        categoryRoot: "Sunucular",
        namePattern: "DELL(?:\\s+(?:POWEREDGE\\s+)?R\\s*740\\s*XD|\\s+VXRAIL\\s+570F?\\s*-?\\s*R\\s*740\\s*XD)(?:\\b|$)",
        sourcePage: "https://www.dell.com/support/product-details/en-us/product/poweredge-r740xd/overview",
        sourceImage: "https://i.dell.com/is/image/DellContent//content/dam/ss2/product-images/dell-enterprise-products/enterprise-systems/poweredge/r-series/r740xd/global-spi/enterprise-servers-poweredge-dellemc-per740-bezel-lcd-lf-on-left-relativesize-500-ng.psd?fmt=png-alpha",
    },
    {
        key: "dell-poweredge-r760xs",
        filename: "dell-poweredge-r760xs.png",
        categoryRoot: "Sunucular",
        namePattern: "DELL\\s+(?:POWEREDGE\\s+)?R\\s*760\\s*XS(?:\\b|$)",
        sourcePage: "https://www.dell.com/support/product-details/en-us/product/poweredge-r760xs/overview",
        sourceImage: "https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-enterprise-products/enterprise-systems/poweredge/r760xs/spi/enterprise-server-poweredge-r760xs-black-relativesize-500-ng.psd?qlt=95&fit=constrain,1&hei=350&wid=504&fmt=jpg",
    },
];

const ALLOWED_IMAGE_HOSTS = new Set([
    "assets.ext.hpe.com",
    "www.amd.com",
    "www.intel.com",
    "i.dell.com",
]);

async function downloadImage(source) {
    const imageUrl = new URL(source.sourceImage);
    if (!ALLOWED_IMAGE_HOSTS.has(imageUrl.hostname)) {
        throw new Error(`Unapproved image host for ${source.key}: ${imageUrl.hostname}`);
    }

    const response = await fetch(imageUrl, { headers: { "User-Agent": "ServerSatisCatalog/1.0" } });
    if (!response.ok) throw new Error(`Image download failed for ${source.key}: HTTP ${response.status}`);

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
        throw new Error(`Unexpected content type for ${source.key}: ${contentType}`);
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 1024 || bytes.length > 5 * 1024 * 1024) {
        throw new Error(`Unexpected image size for ${source.key}: ${bytes.length}`);
    }

    await fs.mkdir(ASSET_DIR, { recursive: true });
    const destination = path.join(ASSET_DIR, source.filename);
    const temporary = `${destination}.download`;
    await fs.writeFile(temporary, bytes);
    await fs.rename(temporary, destination);
    return { bytes: bytes.length, contentType };
}

async function matchingProducts(source) {
    const localPath = `/product-images/official/${source.filename}`;
    const managedPaths = [localPath, ...(source.previousLocalPaths || [])];
    const result = await pool.query(
        `
            SELECT p.id, p.name, p.image_url
            FROM products p
            JOIN categories c ON c.id = p.category_id
            WHERE c.path LIKE $1
              AND (
                  p.image_url IS NULL
                  OR BTRIM(p.image_url) = ''
                  OR p.image_url = ANY($2::text[])
              )
            ORDER BY p.name
        `,
        [`${source.categoryRoot}%`, managedPaths]
    );
    const pattern = new RegExp(source.namePattern, "iu");
    return { localPath, managedPaths, rows: result.rows.filter((product) => pattern.test(product.name)) };
}

async function main() {
    const plan = [];
    for (const source of SOURCES) {
        const products = await matchingProducts(source);
        plan.push({
            source,
            products: products.rows,
            pendingProducts: products.rows.filter((product) => product.image_url !== products.localPath),
            managedPaths: products.managedPaths,
        });
    }

    console.log(JSON.stringify({
        mode: APPLY ? "apply" : "dry-run",
        totalProductsCovered: plan.reduce((total, item) => total + item.products.length, 0),
        totalPending: plan.reduce((total, item) => total + item.pendingProducts.length, 0),
        sources: plan.map((item) => ({
            key: item.source.key,
            covered: item.products.length,
            pending: item.pendingProducts.length,
        })),
    }, null, 2));

    if (!APPLY) return;

    const downloads = new Map();
    for (const item of plan) downloads.set(item.source.key, await downloadImage(item.source));

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        for (const item of plan) {
            const ids = item.pendingProducts.map((product) => product.id);
            if (!ids.length) continue;
            await client.query(
                `
                    UPDATE products
                    SET image_url = $1, updated_at = NOW()
                    WHERE id = ANY($2::uuid[])
                      AND (
                          image_url IS NULL
                          OR BTRIM(image_url) = ''
                          OR image_url = ANY($3::text[])
                      )
                `,
                [`/product-images/official/${item.source.filename}`, ids, item.managedPaths]
            );
        }
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }

    const manifest = {
        generatedAt: new Date().toISOString(),
        policy: "Official manufacturer product pages only; no watermark removal or image alteration.",
        totalProductsCovered: plan.reduce((total, item) => total + item.products.length, 0),
        totalProductsUpdatedThisRun: plan.reduce((total, item) => total + item.pendingProducts.length, 0),
        sources: plan.map((item) => ({
            key: item.source.key,
            localPath: `/product-images/official/${item.source.filename}`,
            sourcePage: item.source.sourcePage,
            sourceImage: item.source.sourceImage,
            matchPattern: item.source.namePattern,
            categoryRoot: item.source.categoryRoot,
            previousLocalPaths: item.source.previousLocalPaths || [],
            productCount: item.products.length,
            productIds: item.products.map((product) => product.id),
            ...downloads.get(item.source.key),
        })),
    };
    await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    console.log(`Manifest written: ${MANIFEST_PATH}`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
