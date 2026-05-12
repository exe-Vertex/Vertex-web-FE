import React from 'react';

interface VertexLogoProps {
  size?: number;
  className?: string;
}

export const VertexLogo: React.FC<VertexLogoProps> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="6" cy="6" r="3" fill="currentColor" fillOpacity="0.8" />
    <circle cx="18" cy="6" r="3" fill="currentColor" fillOpacity="0.8" />
    <circle cx="12" cy="18" r="3" fill="currentColor" fillOpacity="0.8" />
    <path
      d="M6 6L12 18L18 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
