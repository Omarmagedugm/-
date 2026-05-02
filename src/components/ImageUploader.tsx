import React, { useState, useRef } from 'react';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface ImageUploaderProps {
  folderName: string;
  onUploadSuccess: (url: string) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  className?: string;
  previewImageUrl?: string;
  showPreview?: boolean;
  buttonClassName?: string;
  iconOnly?: boolean;
}

export default function ImageUploader({ 
  folderName, 
  onUploadSuccess, 
  onError, 
  buttonText = 'اختر صورة', 
  className = '',
  previewImageUrl = '',
  showPreview = true,
  buttonClassName = '',
  iconOnly = false
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(previewImageUrl);

  const CLOUD_NAME = 'dqj6gzwfg';
  const UPLOAD_PRESET = 'uhicj3ig';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (showPreview && !iconOnly) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folderName);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      
      if (data.secure_url) {
        if (showPreview && !iconOnly) {
          setPreviewUrl(data.secure_url);
        }
        onUploadSuccess(data.secure_url);
      } else {
        throw new Error(data.error?.message || 'حدث خطأ أثناء رفع الصورة');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      if (onError) onError(error instanceof Error ? error.message : 'فشل الرفع');
    } finally {
      setIsUploading(false);
      // Reset the value via target to allow picking the same file again
      e.target.value = '';
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {showPreview && previewUrl && !iconOnly && (
        <div className="relative w-32 h-32 rounded-2xl overflow-hidden glass-card border border-white/20">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>
      )}
      
      <label
        className={buttonClassName || (iconOnly 
          ? `flex items-center justify-center transition-all ${isUploading ? 'text-primary opacity-50 cursor-not-allowed' : 'text-slate-400 hover:text-primary cursor-pointer'}` 
          : `flex items-center justify-center cursor-pointer gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all w-full max-w-xs ${
          isUploading 
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed' 
            : 'bg-primary text-white hover:bg-primary-dark shadow-xl hover:shadow-primary/30'
        }`)}
      >
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          className="absolute w-1 h-1 opacity-0 overflow-hidden -z-10"
          disabled={isUploading}
        />
        {isUploading ? (
          iconOnly ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <Loader2 className="w-5 h-5" />
            </motion.div>
          ) : (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>جاري الرفع والحفظ...</span>
            </>
          )
        ) : (
          iconOnly ? (
            <ImageIcon className="w-5 h-5" />
          ) : (
            <>
              <ImageIcon className="w-5 h-5" />
              <span>{buttonText}</span>
            </>
          )
        )}
      </label>
    </div>
  );
}
