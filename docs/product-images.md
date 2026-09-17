# Product image workflow

Product images belong in `frontend/public/product-images/` and are stored in the
database as root-relative paths such as `/product-images/dell-r750-front.webp`.

- Use only manufacturer or supplier images whose reuse is permitted.
- Do not remove, cover, or retouch logos or watermarks from third-party images.
- Prefer lowercase, descriptive filenames and WebP/JPEG output appropriate for the web.
- The storefront falls back to a branded category placeholder if an image is missing
  or cannot be loaded.

At the 00-07/00-08 audit, all 2,729 product `image_url` values were empty, but every
record retained a ServerPark product page in `source_url` (`source_key = serverpark`).
Those pages still expose product images through their `og:image` metadata. A sampled
image contains a prominent ServerPark logo and sales/warranty badges, so those images
were not copied into the storefront or linked in the database.

The verified official-source batches use model-family matching against HPE Store, Dell
Support, AMD, and Intel product pages. They link 928 products to 17 assigned local manufacturer
images: HPE ProLiant DL380 Gen10/Gen11 and DL360 Gen10/Gen11; Dell PowerEdge R620,
R630, R640, R730, R730xd, R740, R740xd, and R760xs; plus AMD EPYC and Ryzen family
images; Intel Xeon, Core Ultra Series 2, and 13th Gen Core family images. Dell VxRail
570/570F configurations that explicitly identify the R740xd chassis
reuse the verified R740xd image. CPU, RAM, storage, and power-supply variations of the
same chassis intentionally share one model-family image. No third-party watermark was
removed or altered.

The source page, original image URL, exact match expression, covered product IDs,
content type, and byte size are recorded in `docs/product-image-sources.json`. Run
`npm run images:sync:official` from `backend/` to preview the matches, then add
`-- --apply` to download and assign them. Remaining products keep the storefront
placeholder until an official manufacturer source is verified.
