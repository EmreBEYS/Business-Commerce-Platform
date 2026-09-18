const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const multer = require("multer");

const {
    PRODUCT_UPLOAD_DIRECTORY,
    PRODUCT_UPLOAD_URL_PREFIX,
    removeManagedImage,
} = require("../utils/productImages");

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const EXTENSION_BY_MIME = new Map([
    ["image/jpeg", ".jpg"],
    ["image/png", ".png"],
    ["image/webp", ".webp"],
    ["image/gif", ".gif"],
]);

const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, PRODUCT_UPLOAD_DIRECTORY);
    },
    filename(req, file, callback) {
        callback(null, `${randomUUID()}${EXTENSION_BY_MIME.get(file.mimetype)}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
    fileFilter(req, file, callback) {
        if (!EXTENSION_BY_MIME.has(file.mimetype)) {
            const error = new Error("Yalnızca JPEG, PNG, WebP veya GIF görseller yüklenebilir.");
            error.status = 400;
            callback(error);
            return;
        }

        callback(null, true);
    },
});

const hasValidSignature = (mime, bytes) => {
    if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (mime === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (mime === "image/webp") return bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
    if (mime === "image/gif") return ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString());
    return false;
};

const cleanupUploadedFile = async(req) => {
    if (req.file) {
        await removeManagedImage(`${PRODUCT_UPLOAD_URL_PREFIX}${req.file.filename}`).catch(() => {});
    }
};

const productImageUpload = (req, res, next) => {
    upload.single("image")(req, res, async(error) => {
        if (error) {
            const message = error.code === "LIMIT_FILE_SIZE"
                ? "Görsel boyutu en fazla 5 MB olabilir."
                : error.message || "Görsel yüklenemedi.";

            return res.status(error.status || 400).json({ success: false, message });
        }

        try {
            if (req.file) {
                const handle = await fs.open(req.file.path, "r");
                const bytes = Buffer.alloc(16);
                await handle.read(bytes, 0, bytes.length, 0);
                await handle.close();

                if (!hasValidSignature(req.file.mimetype, bytes)) {
                    await cleanupUploadedFile(req);
                    return res.status(400).json({
                        success: false,
                        message: "Dosya içeriği geçerli bir görsel formatıyla eşleşmiyor.",
                    });
                }

                req.body.imageUrl = `${PRODUCT_UPLOAD_URL_PREFIX}${req.file.filename}`;
            } else if (req.body.removeImage === "true") {
                req.body.imageUrl = null;
            }

            delete req.body.removeImage;

            if (Object.hasOwn(req.body, "stockQuantity") && typeof req.body.stockQuantity === "string") {
                req.body.stockQuantity = Number(req.body.stockQuantity);
            }

            next();
        } catch (verificationError) {
            await cleanupUploadedFile(req);
            next(verificationError);
        }
    });
};

module.exports = { cleanupUploadedFile, productImageUpload };
