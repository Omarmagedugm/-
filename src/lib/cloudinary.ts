/**
 * Cloudinary image optimization utility
 */
export const getOptimizedImage = (url: string | undefined | null, width?: number) => {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;
  
  // Check if it's already optimized by our code
  if (url.includes('q_auto')) {
     // If width is specified and missing, we might still want to add it, 
     // but to keep it simple, we skip if auto is already there.
     if (!width || url.includes(',w_')) return url;
  }

  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  
  // Build transformations
  const transformations = [];
  
  // Don't use f_auto for PNGs to ensure transparency is never lost
  if (!url.toLowerCase().includes('.png')) {
    transformations.push('f_auto');
  }
  transformations.push('q_auto');
  
  if (width) {
    transformations.push(`w_${width}`, 'c_scale');
  }
  
  // Handle case where parts[1] might already start with some transformations (not likely for secure_url but possible)
  // Standard Cloudinary URL: .../upload/v12345/public_id.jpg
  // If we find a version or public ID, we insert our transformations before it.
  
  return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
};
