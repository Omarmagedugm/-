/**
 * Cloudinary image optimization utility
 */
export const getOptimizedImage = (url: string | undefined | null, width?: number) => {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;
  
  // Check if it's already optimized by our code
  if (url.includes('f_auto,q_auto')) {
     // If width is specified and missing, we might still want to add it, 
     // but to keep it simple, we skip if auto is already there.
     if (!width || url.includes(',w_')) return url;
  }

  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  
  // Build transformations
  // f_auto: choose best format (webp/avif)
  // q_auto: automated quality compression
  const transformations = ['f_auto', 'q_auto'];
  if (width) {
    transformations.push(`w_${width}`, 'c_scale');
  }
  
  // Handle case where parts[1] might already start with some transformations (not likely for secure_url but possible)
  // Standard Cloudinary URL: .../upload/v12345/public_id.jpg
  // If we find a version or public ID, we insert our transformations before it.
  
  return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
};
