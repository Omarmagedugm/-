import React, { useState } from 'react';
import { getOptimizedImage } from '../lib/cloudinary';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  width?: number;
  fallback?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
}

export const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  width, 
  fallback = 'https://res.cloudinary.com/dqj6gzwfg/image/upload/v1777716805/favicon_gd0ic4.png',
  fetchPriority,
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);

  const optimizedSrc = getOptimizedImage(src, width);
  const isContain = className.includes('object-contain');
  const fitClass = isContain ? 'object-contain' : 'object-cover';

  return (
    <div className={`relative overflow-hidden ${className} flex items-center justify-center`}>
      <img
        {...props}
        src={hasError ? fallback : optimizedSrc}
        alt={alt || ''}
        fetchPriority={fetchPriority}
        onError={() => setHasError(true)}
        className={`w-full h-full ${fitClass}`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

