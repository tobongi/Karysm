import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(base64Data: string, folder: string): Promise<string> {
  const result = await cloudinary.uploader.upload(
    `data:image/jpeg;base64,${base64Data}`,
    {
      folder: `karysm/${folder}`,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { format: 'webp' },
      ],
    }
  );
  return result.secure_url;
}

export async function uploadAvatar(base64Data: string): Promise<string> {
  const result = await cloudinary.uploader.upload(
    `data:image/jpeg;base64,${base64Data}`,
    {
      folder: 'karysm/avatars',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { format: 'webp' },
      ],
    }
  );
  return result.secure_url;
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
