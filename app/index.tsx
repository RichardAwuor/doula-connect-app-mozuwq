
import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useUser } from '@/contexts/UserContext';

export default function Index() {
  const { userProfile } = useUser();

  // If user has completed registration and payment, go to main app
  if (userProfile && userProfile.subscriptionActive) {
    return <Redirect href="/(tabs)/connect" />;
  }

  // Otherwise, start with welcome screen
  return <Redirect href="/welcome" />;
}
