import { S3Controller } from "../controllers/s3.controller";

if (!process.env.AWS_ACCESS_KEY_ID) throw new Error('AWS_ACCESS_KEY_ID is not defined');
if (!process.env.AWS_SECRET_ACCESS_KEY) throw new Error('AWS_SECRET_ACCESS_KEY is not defined');
if (!process.env.AWS_REGION) throw new Error('AWS_REGION is not defined');
if (!process.env.AWS_BUCKET_NAME) throw new Error('AWS_BUCKET_NAME is not defined');

export const s3Controller = new S3Controller({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucketName: process.env.AWS_BUCKET_NAME
});