
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { colors } from '@/styles/commonStyles';

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const { userProfile } = useUser();

  useEffect(() => {
    console.log('📍 Index screen mounted');
    console.log('👤 User profile:', userProfile ? 'exists' : 'null');
    
    // Give a small delay to ensure contexts are fully initialized
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [userProfile]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  // If user has completed registration and payment, go to main app
  if (userProfile && userProfile.subscriptionActive) {
    console.log('✅ Redirecting to connect screen (user authenticated)');
    return <Redirect href="/(tabs)/connect" />;
  }

  // Otherwise, start with welcome screen
  console.log('➡️ Redirecting to welcome screen');
  return <Redirect href="/welcome" />;
}
