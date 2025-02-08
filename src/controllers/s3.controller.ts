import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    HeadObjectCommand,
    CopyObjectCommand
} from '@aws-sdk/client-s3';

interface S3Config {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
}

export class S3Controller {
    private s3Client: S3Client;
    private bucketName: string;

    constructor(config: S3Config) {
        this.s3Client = new S3Client({
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey
            }
        });
        this.bucketName = config.bucketName;
    }

    async uploadFile(file: Express.Multer.File) {
        try {
            const key = `${Date.now()}-${file.originalname}`;
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read'
            });

            const result = await this.s3Client.send(command);

            return {
                success: true,
                key,
                url: `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
                data: result
            };
        } catch (error) {
            console.error('S3 upload error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async uploadMultipleFiles(files: Express.Multer.File[]) {
        console.log("MULTIPLE FILES", files);
        const uploadPromises = files.map(file => this.uploadFile(file));
        return Promise.all(uploadPromises);
    }

    async getFileDetails(key: string) {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });

            const result = await this.s3Client.send(command);

            return {
                success: true,
                metadata: {
                    contentType: result.ContentType,
                    size: result.ContentLength,
                    lastModified: result.LastModified,
                    metadata: result.Metadata
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async downloadFile(key: string) {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });

            const result = await this.s3Client.send(command);

            const chunks = [];
            for await (const chunk of result.Body as any) {
                chunks.push(chunk);
            }

            return {
                success: true,
                data: Buffer.concat(chunks),
                contentType: result.ContentType,
                metadata: result.Metadata
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async deleteFile(key: string) {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });

            await this.s3Client.send(command);

            return {
                success: true,
                message: 'File deleted successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async deleteMultipleFiles(keys: string[]) {
        const deletePromises = keys.map(key => this.deleteFile(key));
        return Promise.all(deletePromises);
    }

    async listFiles(prefix: string = '', maxKeys: number = 1000) {
        try {
            const command = new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix,
                MaxKeys: maxKeys
            });

            const result = await this.s3Client.send(command);

            return {
                success: true,
                files: result.Contents?.map(item => ({
                    key: item.Key,
                    size: item.Size,
                    lastModified: item.LastModified,
                    url: `https://${this.bucketName}.s3.amazonaws.com/${item.Key}`
                })) || []
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async copyFile(sourceKey: string, destinationKey: string) {
        try {
            const command = new CopyObjectCommand({
                Bucket: this.bucketName,
                CopySource: `${this.bucketName}/${sourceKey}`,
                Key: destinationKey
            });

            const result = await this.s3Client.send(command);

            return {
                success: true,
                source: sourceKey,
                destination: destinationKey,
                data: result
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    async fileExists(key: string) {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });

            await this.s3Client.send(command);
            return {
                success: true,
                exists: true
            };
        } catch (error) {
            if ((error as any).name === 'NotFound') {
                return {
                    success: true,
                    exists: false
                };
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}