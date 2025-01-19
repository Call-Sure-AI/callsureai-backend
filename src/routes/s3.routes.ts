import { Router, Request, Response } from 'express';
import multer from 'multer';
import { S3Controller } from '../controllers/s3.controller';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    }
});

const s3Controller = new S3Controller({
    region: process.env.AWS_REGION!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
    bucketName: process.env.AWS_BUCKET_NAME!
});

const router = Router();

router.post('/upload',
    upload.single('file'),
    async (req: Request, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file provided'
                });
            }

            const result = await s3Controller.uploadFile(req.file);
            return res.status(result.success ? 200 : 500).json(result);
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
);

router.post('/upload-multiple',
    upload.array('files', 10),
    async (req: Request, res: Response) => {
        try {
            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No files provided'
                });
            }

            const results = await s3Controller.uploadMultipleFiles(req.files);
            return res.status(200).json({
                success: true,
                files: results
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
);

router.get('/:key', async (req: Request, res: Response) => {
    try {
        const key = decodeURIComponent(req.params.key);
        const result = await s3Controller.getFileDetails(key);
        return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.get('/download/:key', async (req: Request, res: Response) => {
    try {
        const key = decodeURIComponent(req.params.key);
        const result = await s3Controller.downloadFile(key);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.setHeader('Content-Type', result.contentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${key}"`);
        return res.send(result.data);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.delete('/delete/:key', async (req: Request, res: Response) => {
    try {
        const key = decodeURIComponent(req.params.key);
        const result = await s3Controller.deleteFile(key);
        return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.delete('/delete-multiple', async (req: Request, res: Response) => {
    try {
        const { keys } = req.body;

        if (!Array.isArray(keys) || keys.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No file keys provided'
            });
        }

        const results = await s3Controller.deleteMultipleFiles(keys);
        return res.status(200).json({
            success: true,
            results
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.get('/list', async (req: Request, res: Response) => {
    try {
        const prefix = req.query.prefix as string || '';
        const maxKeys = parseInt(req.query.maxKeys as string || '1000');

        const result = await s3Controller.listFiles(prefix, maxKeys);
        return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.post('/copy', async (req: Request, res: Response) => {
    try {
        const { sourceKey, destinationKey } = req.body;

        if (!sourceKey || !destinationKey) {
            return res.status(400).json({
                success: false,
                error: 'Source and destination keys are required'
            });
        }

        const result = await s3Controller.copyFile(sourceKey, destinationKey);
        return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.get('/exists/:key', async (req: Request, res: Response) => {
    try {
        const key = decodeURIComponent(req.params.key);
        const result = await s3Controller.fileExists(key);
        return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;