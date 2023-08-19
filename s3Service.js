const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

exports.s3Uploadv3 = async (path, newFileBuffer) => {
  const s3client = new S3Client();

  const param = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: path,
    Body: newFileBuffer,
  };
  return s3client.send(new PutObjectCommand(param));
};

exports.s3DeleteV3 = async (path) => {
  const s3client = new S3Client();

  const param = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: path,
  };
  return s3client.send(new DeleteObjectCommand(param));
};
