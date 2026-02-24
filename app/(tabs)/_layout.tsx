
import React from 'react';
import { Tabs } from 'expo-router';
import FloatingTabBar from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <FloatingTabBar
          tabs={[
            {
              name: 'connect',
              route: '/(tabs)/connect',
              label: 'Connect',
              icon: 'favorite',
            },
            {
              name: 'profile',
              route: '/(tabs)/profile',
              label: 'Profile',
              icon: 'person',
            },
          ]}
        />
      )}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
      }}
    >
      <Tabs.Screen name="connect" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
