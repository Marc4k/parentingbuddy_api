const sharp = require("sharp");
const { s3Uploadv3 } = require("./s3Service");
exports.uploadImage = async (path, fileBuffer) => {
  const newFileBuffer = await sharp(fileBuffer)
    .resize({ width: 500, height: 500 })
    .jpeg({ force: true, quality: 90 })
    .toBuffer();

  try {
    const results = await s3Uploadv3(path, fileBuffer);
    console.log(results);

    return `https://parenting-buddy.s3.eu-central-1.amazonaws.com/${path}`;
  } catch (err) {
    return "no-upload";
  }
};
