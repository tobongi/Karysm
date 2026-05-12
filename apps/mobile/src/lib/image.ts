/**
 * Cloudinary URL optimizer — adds c_scale,w_{width},q_auto,f_auto transform.
 * Non-Cloudinary URLs pass through unchanged.
 */
export function imgUrl(url: string | null | undefined, width = 400): string | null {
  if (!url) return null;
  if (!url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/c_scale,w_${width},q_auto,f_auto/`);
}
