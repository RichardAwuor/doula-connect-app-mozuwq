
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = 'doula_connect_user_id';
const USER_TYPE_KEY = 'doula_connect_user_type';

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const { userProfile, setUserProfile } = useUser();

  useEffect(() => {
    console.log('📍 Index screen mounted');
    console.log('👤 User profile:', userProfile ? 'exists' : 'null');
    
    // Try to restore user session from storage
    const restoreSession = async () => {
      try {
        const userId = await AsyncStorage.getItem(USER_ID_KEY);
        const userType = await AsyncStorage.getItem(USER_TYPE_KEY);
        
        if (userId && userType && !userProfile) {
          console.log('🔄 Restoring user session:', userId, userType);
          
          // Fetch user profile from backend
          const { apiGet } = await import('@/utils/api');
          const endpoint = userType === 'parent' 
            ? `/parents/${userId}`
            : `/doulas/${userId}`;
          
          console.log('📡 Fetching profile from:', endpoint);
          const profileData = await apiGet(endpoint);
          console.log('✅ Profile fetched:', profileData);
          
          // Convert date strings back to Date objects for parent profiles
          if (userType === 'parent') {
            profileData.servicePeriodStart = profileData.servicePeriodStart 
              ? new Date(profileData.servicePeriodStart) 
              : null;
            profileData.servicePeriodEnd = profileData.servicePeriodEnd 
              ? new Date(profileData.servicePeriodEnd) 
              : null;
            profileData.desiredStartTime = profileData.desiredStartTime 
              ? new Date(profileData.desiredStartTime) 
              : null;
            profileData.desiredEndTime = profileData.desiredEndTime 
              ? new Date(profileData.desiredEndTime) 
              : null;
          }
          
          // Fetch subscription status
          try {
            const subscriptionData = await apiGet(`/subscriptions/${userId}`);
            console.log('💳 Subscription status:', subscriptionData);
            profileData.subscriptionActive = subscriptionData.status === 'active';
          } catch (error) {
            console.warn('⚠️ Could not fetch subscription status:', error);
            // Default to false if subscription not found
            profileData.subscriptionActive = false;
          }
          
          setUserProfile({
            ...profileData,
            userType: userType as 'parent' | 'doula',
          });
        }
      } catch (error) {
        console.error('❌ Error restoring session:', error);
        // Clear invalid session data
        await AsyncStorage.removeItem(USER_ID_KEY);
        await AsyncStorage.removeItem(USER_TYPE_KEY);
      } finally {
        setIsReady(true);
      }
    };

    restoreSession();
  }, []);

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
