/**
 * Cloudinary image optimization utility
 */
export const getOptimizedImage = (url: string | undefined | null, width?: number) => {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;
  
  // Prevent double optimization
  if (url.includes('q_auto') || url.includes('f_auto')) return url;

  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  
  const transformations = ['f_auto', 'q_auto'];
  if (width) {
    transformations.push(`w_${width}`, 'c_scale');
  }
  
  return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
};
