const fs = require("node:fs/promises");
const path = require("node:path");

const PRODUCT_UPLOAD_DIRECTORY = path.resolve(__dirname, "../../uploads/products");
const PRODUCT_UPLOAD_URL_PREFIX = "/uploads/products/";

const getManagedImagePath = (imageUrl) => {
    if (typeof imageUrl !== "string" || !imageUrl.startsWith(PRODUCT_UPLOAD_URL_PREFIX)) {
        return null;
    }

    const fileName = imageUrl.slice(PRODUCT_UPLOAD_URL_PREFIX.length);

    if (!fileName || fileName !== path.basename(fileName)) {
        return null;
    }

    const resolvedPath = path.resolve(PRODUCT_UPLOAD_DIRECTORY, fileName);
    const directoryPrefix = `${PRODUCT_UPLOAD_DIRECTORY}${path.sep}`;

    return resolvedPath.startsWith(directoryPrefix) ? resolvedPath : null;
};

const removeManagedImage = async(imageUrl) => {
    const filePath = getManagedImagePath(imageUrl);

    if (!filePath) return false;

    try {
        await fs.unlink(filePath);
        return true;
    } catch (error) {
        if (error.code === "ENOENT") return false;
        throw error;
    }
};

module.exports = {
    PRODUCT_UPLOAD_DIRECTORY,
    PRODUCT_UPLOAD_URL_PREFIX,
    getManagedImagePath,
    removeManagedImage,
};
