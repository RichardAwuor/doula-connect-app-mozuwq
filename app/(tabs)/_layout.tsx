
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
              route: '/(tabs)/connect',
              label: 'Connect',
              ios_icon_name: 'heart.fill',
              android_material_icon_name: 'favorite',
            },
            {
              route: '/(tabs)/profile',
              label: 'Profile',
              ios_icon_name: 'person.fill',
              android_material_icon_name: 'person',
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
