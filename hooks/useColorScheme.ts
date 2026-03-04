import { useColorScheme as _useColorScheme } from 'react-native';

export function useColorScheme(): 'light' {
  _useColorScheme();
  return 'light';
}
