import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../api/http';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, fallback, size = 'md', className = '' }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };
  const resolvedSrc = src?.startsWith('/') ? `${API_BASE_URL}${src}` : src;

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedSrc]);

  return (
    <div className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#162032] ${sizes[size]} ${className}`}>
      {resolvedSrc && !imageFailed ? (
        <img
          className="h-full w-full object-cover"
          src={resolvedSrc}
          alt={alt || fallback}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="font-medium text-slate-400">{fallback}</span>
      )}
    </div>
  );
};
