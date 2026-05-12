import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { ValidationError } from '../lib/errors';

const router = Router();

const CLOUDINARY_CONFIGURED = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY);

// ~10MB base64 limit for images (10MB binary = ~13.3MB base64)
const MAX_BASE64_SIZE = 13_400_000;
// ~50MB for videos (will be compressed by Cloudinary)
const MAX_VIDEO_BASE64_SIZE = 67_000_000;

// Lazy-load cloudinary only when configured (avoids lodash dependency crash)
async function getCloudinaryHelpers() {
  const mod = await import('../lib/cloudinary');
  return mod;
}

// POST /api/upload/image
router.post('/image', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { data, folder } = req.body;

  if (!data || typeof data !== 'string') {
    throw new ValidationError('Missing required field: data (base64 string)');
  }

  if (data.length > MAX_BASE64_SIZE) {
    throw new ValidationError('Image too large. Maximum size is 10MB.');
  }

  const targetFolder = folder || 'uploads';

  if (!CLOUDINARY_CONFIGURED) {
    return res.json({
      success: true,
      data: { url: `https://placehold.co/400x400/7C3AED/white?text=${targetFolder}` },
    });
  }

  const { uploadImage } = await getCloudinaryHelpers();
  const url = await uploadImage(data, targetFolder);
  res.json({ success: true, data: { url } });
}));

// POST /api/upload/avatar
router.post('/avatar', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { data } = req.body;

  if (!data || typeof data !== 'string') {
    throw new ValidationError('Missing required field: data (base64 string)');
  }

  if (data.length > MAX_BASE64_SIZE) {
    throw new ValidationError('Image too large. Maximum size is 10MB.');
  }

  if (!CLOUDINARY_CONFIGURED) {
    return res.json({
      success: true,
      data: { url: 'https://placehold.co/400x400/7C3AED/white?text=avatar' },
    });
  }

  const { uploadAvatar } = await getCloudinaryHelpers();
  const url = await uploadAvatar(data);
  res.json({ success: true, data: { url } });
}));

// POST /api/upload/video
router.post('/video', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { data, folder } = req.body;

  if (!data || typeof data !== 'string') {
    throw new ValidationError('Missing required field: data (base64 string)');
  }

  if (data.length > MAX_VIDEO_BASE64_SIZE) {
    throw new ValidationError('Vidéo trop volumineuse. Maximum 50MB.');
  }

  const targetFolder = folder || 'videos';

  if (!CLOUDINARY_CONFIGURED) {
    return res.json({
      success: true,
      data: { url: `https://placehold.co/400x400/7C3AED/white?text=video` },
    });
  }

  const { cloudinary } = await getCloudinaryHelpers();
  const result = await cloudinary.uploader.upload(
    `data:video/mp4;base64,${data}`,
    {
      folder: `karysm/${targetFolder}`,
      resource_type: 'video',
      transformation: [
        { quality: 'auto:good' },
        { format: 'mp4' },
      ],
      eager: [
        // Generate thumbnail
        { width: 400, height: 400, crop: 'fill', format: 'jpg' },
      ],
    }
  );
  res.json({
    success: true,
    data: {
      url: result.secure_url,
      thumbnail: result.eager?.[0]?.secure_url || result.secure_url.replace('.mp4', '.jpg'),
      type: 'video',
    },
  });
}));

export default router;
