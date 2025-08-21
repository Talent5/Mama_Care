import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface LogoProps {
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

const Logo: React.FC<LogoProps> = ({
  size,
  width,
  height,
  style,
  resizeMode = 'contain'
}) => {
  const logoWidth = width || size || 40;
  const logoHeight = height || size || 40;

  return (
    <Image
      source={require('../assets/images/Logo.png')}
      style={[
        {
          width: logoWidth,
          height: logoHeight,
        },
        style
      ]}
      resizeMode={resizeMode}
    />
  );
};

export default Logo;
