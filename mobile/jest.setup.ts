import 'react-native-gesture-handler/jestSetup';

// mock de SVG
jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    Svg: (props: any) => React.createElement('Svg', props),
    Path: (props: any) => React.createElement('Path', props),
  };
});

// mock de imagens
jest.mock('react-native/Libraries/Image/Image', () => 'Image');

// mock de qualquer logo / componente visual problemático
jest.mock('./components/LoginLogo', () => 'LoginLogo');