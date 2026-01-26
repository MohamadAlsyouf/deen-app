// Import gesture handler only on native platforms (not web)
try {
  require('react-native-gesture-handler');
} catch (e) {
  // Ignore on web platform
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
