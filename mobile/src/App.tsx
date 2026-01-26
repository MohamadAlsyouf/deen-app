import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/AuthProvider';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { AppNavigator } from '@/navigation/AppNavigator';
import { keyframes } from '@/theme/web';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Inject keyframes into document head (web only)
let keyframesInjected = false;
const injectKeyframes = () => {
  if (Platform.OS !== 'web' || keyframesInjected || typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = Object.values(keyframes).join('\n');
  style.setAttribute('data-deen-app-keyframes', 'true');
  document.head.appendChild(style);
  keyframesInjected = true;
};

const App: React.FC = () => {
  useEffect(() => {
    if (Platform.OS === 'web') {
      injectKeyframes();
    }
  }, []);

  return (
    <View style={styles.root}>
      <SafeAreaProvider style={styles.safeArea}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AudioPlayerProvider>
              <StatusBar style="auto" />
              <AppNavigator />
            </AudioPlayerProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // Web-specific: ensure the root takes full viewport height
    ...(Platform.OS === 'web' && {
      height: '100%' as const,
      overflow: 'hidden' as const,
    }),
  },
  safeArea: {
    flex: 1,
  },
});

export default App;

