import * as ImagePicker from 'expo-image-picker';
import { api } from './api';

export interface MediaResult {
  url: string;
  type: 'image' | 'video';
}

export async function pickImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: true,
  });

  if (result.canceled || !result.assets[0].base64) return null;
  return result.assets[0].base64;
}

export async function pickMedia(): Promise<{ base64: string; type: 'image' | 'video'; uri: string } | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    allowsEditing: true,
    quality: 0.7,
    base64: true,
    videoMaxDuration: 60, // 60 seconds max
    videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const isVideo = asset.type === 'video';

  // For videos, base64 might not be available — use uri instead
  return {
    base64: asset.base64 || '',
    type: isVideo ? 'video' : 'image',
    uri: asset.uri,
  };
}

export async function pickAndUploadImage(folder: string): Promise<string | null> {
  const base64 = await pickImage();
  if (!base64) return null;

  const res = await api<{ success: boolean; data: { url: string } }>('/upload/image', {
    method: 'POST',
    body: JSON.stringify({ data: base64, folder }),
  });

  return res.data?.url || null;
}

export async function pickAndUploadMedia(folder: string): Promise<MediaResult | null> {
  const media = await pickMedia();
  if (!media) return null;

  if (media.type === 'video') {
    // Videos: upload via uri (base64 too large for videos)
    // For web: use base64 if available, otherwise uri fetch
    let base64 = media.base64;
    if (!base64 && media.uri) {
      try {
        const response = await fetch(media.uri);
        const blob = await response.blob();
        base64 = await blobToBase64(blob);
      } catch {
        return null;
      }
    }
    if (!base64) return null;

    const res = await api<{ success: boolean; data: { url: string } }>('/upload/video', {
      method: 'POST',
      body: JSON.stringify({ data: base64, folder }),
    });

    return res.data?.url ? { url: res.data.url, type: 'video' } : null;
  }

  // Image
  if (!media.base64) return null;
  const res = await api<{ success: boolean; data: { url: string } }>('/upload/image', {
    method: 'POST',
    body: JSON.stringify({ data: media.base64, folder }),
  });

  return res.data?.url ? { url: res.data.url, type: 'image' } : null;
}

export async function pickAndUploadAvatar(): Promise<string | null> {
  const base64 = await pickImage();
  if (!base64) return null;

  const res = await api<{ success: boolean; data: { url: string } }>('/upload/avatar', {
    method: 'POST',
    body: JSON.stringify({ data: base64 }),
  });

  return res.data?.url || null;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data:xxx;base64, prefix
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
