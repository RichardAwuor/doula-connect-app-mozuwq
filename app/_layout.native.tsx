

import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import React, { useEffect } from "react";
import { useNetworkState } from "expo-network";
import { useColorScheme, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { SystemBars } from "react-native-edge-to-edge";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { UserProvider } from "@/contexts/UserContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import "react-native-reanimated";
import { colors } from "@/styles/commonStyles";
import Constants from "expo-constants";
import { StripeProvider } from '@stripe/stripe-react-native';

SplashScreen.preventAutoHideAsync();

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl;
const STRIPE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.stripePublishableKey;
console.log('='.repeat(60));
console.log('🚀 Doula Connect App Starting (Native)');
console.log('📡 Backend URL:', BACKEND_URL || 'NOT CONFIGURED');
console.log('💳 Stripe Key:', STRIPE_PUBLISHABLE_KEY ? 'CONFIGURED' : 'NOT CONFIGURED');
console.log('🌐 Platform:', Platform.OS);
console.log('='.repeat(60));

const DoulaTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

export default function RootLayout() {
  const { isConnected } = useNetworkState();
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"), // eslint-disable-line @typescript-eslint/no-require-imports
  });

  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      SplashScreen.hideAsync();
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      console.log('✅ Fonts loaded successfully');
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeProvider
        publishableKey={STRIPE_PUBLISHABLE_KEY || ''}
        merchantIdentifier="merchant.com.doulaconnect.app"
      >
        <ThemeProvider value={DoulaTheme}>
          <WidgetProvider>
            <UserProvider>
              <SystemBars style="auto" />
              <StatusBar style="auto" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="welcome" />
                <Stack.Screen name="auth/email" />
                <Stack.Screen name="registration/parent" />
                <Stack.Screen name="registration/doula" />
                <Stack.Screen name="payment" />
                <Stack.Screen name="(tabs)" />
              </Stack>
            </UserProvider>
          </WidgetProvider>
        </ThemeProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}

