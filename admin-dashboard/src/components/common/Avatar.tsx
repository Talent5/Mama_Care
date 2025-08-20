import React, { useState } from 'react';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, name = '', size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (fullName: string): string => {
    if (!fullName) return 'U';
    
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold ${className}`;

  const getBackgroundColor = (name: string): string => {
    const colors = [
      'bg-blue-500 text-white',
      'bg-green-500 text-white',
      'bg-purple-500 text-white',
      'bg-pink-500 text-white',
      'bg-indigo-500 text-white',
      'bg-yellow-500 text-white',
      'bg-red-500 text-white',
      'bg-teal-500 text-white',
      'bg-orange-500 text-white',
      'bg-cyan-500 text-white'
    ];
    
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (!src || imageError) {
    return (
      <div className={`${baseClasses} ${getBackgroundColor(name)}`}>
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${baseClasses} object-cover`}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
};

export default Avatar;
