
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { DoulaProfile, ParentProfile } from '@/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { userProfile, setUserProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);

  if (!userProfile) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No profile found</Text>
          <TouchableOpacity
            style={commonStyles.button}
            onPress={() => router.replace('/welcome')}
          >
            <Text style={commonStyles.buttonText}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isParent = userProfile.userType === 'parent';

  const handleSave = async () => {
    console.log('[Profile] Saving profile changes');
    
    try {
      // Backend Integration: Update user profile in database
      // Note: This endpoint needs to be implemented on the backend
      // Expected endpoint: PUT /api/users/profile
      // Expected body: UserProfile object
      // Expected response: { success: boolean, profile: UserProfile }
      
      // For now, using mock implementation until backend endpoint is ready
      // Uncomment below when backend is ready:
      /*
      const { authenticatedPut } = await import('@/utils/api');
      const response = await authenticatedPut('/api/users/profile', userProfile);
      console.log('[Profile] Update response:', response);
      
      if (response.profile) {
        setUserProfile(response.profile);
      }
      */
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('[Profile] Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleLogout = () => {
    console.log('Logging out');
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            setUserProfile(null);
            router.replace('/welcome');
          },
        },
      ]
    );
  };

  const renderParentProfile = (profile: ParentProfile) => (
    <>
      <View style={commonStyles.card}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarPlaceholder}>
            <IconSymbol
              ios_icon_name="person.fill"
              android_material_icon_name="person"
              size={48}
              color={colors.card}
            />
          </View>
          <View style={styles.profileHeaderText}>
            <Text style={styles.profileName}>
              {profile.firstName} {profile.lastName}
            </Text>
            <Text style={styles.profileType}>New Parent</Text>
          </View>
        </View>
      </View>

      <View style={commonStyles.card}>
        <Text style={commonStyles.subtitle}>Location</Text>
        <View style={styles.infoRow}>
          <IconSymbol
            ios_icon_name="location"
            android_material_icon_name="location-on"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            {profile.town}, {profile.state} {profile.zipCode}
          </Text>
        </View>
      </View>

      <View style={commonStyles.card}>
        <Text style={commonStyles.subtitle}>Service Requirements</Text>
        <Text style={styles.label}>Service Categories:</Text>
        <View style={styles.badgeContainer}>
          {profile.serviceCategories.map((cat) => (
            <View key={cat} style={commonStyles.badge}>
              <Text style={commonStyles.badgeText}>
                {cat === 'birth' ? 'Birth Doula' : 'Postpartum Doula'}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.label}>Financing Type:</Text>
        <View style={styles.badgeContainer}>
          {profile.financingType.map((fin) => (
            <View key={fin} style={commonStyles.badge}>
              <Text style={commonStyles.badgeText}>
                {fin === 'self' ? 'Self Pay' : fin === 'carrot' ? 'CARROT' : 'Medicaid'}
              </Text>
            </View>
          ))}
        </View>

        {profile.servicePeriodStart && profile.servicePeriodEnd && (
          <>
            <Text style={styles.label}>Service Period:</Text>
            <Text style={styles.infoText}>
              {profile.servicePeriodStart.toLocaleDateString()} -{' '}
              {profile.servicePeriodEnd.toLocaleDateString()}
            </Text>
          </>
        )}
      </View>

      <View style={commonStyles.card}>
        <Text style={commonStyles.subtitle}>Preferences</Text>
        {profile.preferredLanguages.length > 0 && (
          <>
            <Text style={styles.label}>Languages:</Text>
            <View style={styles.badgeContainer}>
              {profile.preferredLanguages.map((lang) => (
                <View key={lang} style={commonStyles.badge}>
                  <Text style={commonStyles.badgeText}>{lang}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {profile.desiredDays.length > 0 && (
          <>
            <Text style={styles.label}>Desired Days:</Text>
            <View style={styles.badgeContainer}>
              {profile.desiredDays.map((day) => (
                <View key={day} style={commonStyles.badge}>
                  <Text style={commonStyles.badgeText}>{day}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </>
  );

  const renderDoulaProfile = (profile: DoulaProfile) => (
    <>
      <View style={commonStyles.card}>
        <View style={styles.profileHeader}>
          {profile.profilePicture ? (
            <Image source={{ uri: profile.profilePicture.uri }} style={styles.profileImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={48}
                color={colors.card}
              />
            </View>
          )}
          <View style={styles.profileHeaderText}>
            <Text style={styles.profileName}>
              {profile.firstName} {profile.lastName}
            </Text>
            <Text style={styles.profileType}>Certified Doula</Text>
            {profile.rating && (
              <View style={styles.ratingContainer}>
                <IconSymbol
                  ios_icon_name="star.fill"
                  android_material_icon_name="star"
                  size={16}
                  color={colors.accent}
                />
                <Text style={styles.ratingText}>
                  {profile.rating} ({profile.reviewCount} reviews)
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={commonStyles.card}>
        <Text style={commonStyles.subtitle}>Location & Availability</Text>
        <View style={styles.infoRow}>
          <IconSymbol
            ios_icon_name="location"
            android_material_icon_name="location-on"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            {profile.town}, {profile.state} {profile.zipCode}
          </Text>
        </View>
        <Text style={styles.infoText}>Drive distance: up to {profile.driveDistance} miles</Text>
      </View>

      <View style={commonStyles.card}>
        <Text style={commonStyles.subtitle}>Services & Rates</Text>
        <Text style={styles.label}>Service Categories:</Text>
        <View style={styles.badgeContainer}>
          {profile.serviceCategories.map((cat) => (
            <View key={cat} style={commonStyles.badge}>
              <Text style={commonStyles.badgeText}>
                {cat === 'birth' ? 'Birth Doula' : 'Postpartum Doula'}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.label}>Hourly Rate:</Text>
        <Text style={styles.infoText}>
          ${profile.hourlyRateMin} - ${profile.hourlyRateMax} per hour
        </Text>

        <Text style={styles.label}>Payment Preferences:</Text>
        <View style={styles.badgeContainer}>
          {profile.paymentPreferences.map((pref) => (
            <View key={pref} style={commonStyles.badge}>
              <Text style={commonStyles.badgeText}>
                {pref === 'self' ? 'Direct Cash' : pref === 'carrot' ? 'CARROT' : 'Medicaid'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={commonStyles.card}>
        <Text style={commonStyles.subtitle}>Languages & Certifications</Text>
        {profile.spokenLanguages.length > 0 && (
          <>
            <Text style={styles.label}>Languages:</Text>
            <View style={styles.badgeContainer}>
              {profile.spokenLanguages.map((lang) => (
                <View key={lang} style={commonStyles.badge}>
                  <Text style={commonStyles.badgeText}>{lang}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {profile.certifications.length > 0 && (
          <>
            <Text style={styles.label}>Certifications:</Text>
            <View style={styles.badgeContainer}>
              {profile.certifications.map((cert) => (
                <View key={cert} style={[commonStyles.badge, { backgroundColor: colors.secondary }]}>
                  <Text style={commonStyles.badgeText}>
                    {cert.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={commonStyles.title}>Profile</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <IconSymbol
              ios_icon_name="pencil"
              android_material_icon_name="edit"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {isParent ? renderParentProfile(userProfile as ParentProfile) : renderDoulaProfile(userProfile as DoulaProfile)}

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Subscription</Text>
          <View style={styles.subscriptionRow}>
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionLabel}>Status:</Text>
              <Text style={[styles.subscriptionValue, { color: colors.success }]}>Active</Text>
            </View>
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionLabel}>Type:</Text>
              <Text style={styles.subscriptionValue}>
                {isParent ? 'Annual' : 'Monthly'} - $99
              </Text>
            </View>
          </View>
          <TouchableOpacity style={commonStyles.outlineButton}>
            <Text style={commonStyles.outlineButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
        </View>

        {isEditing && (
          <TouchableOpacity style={commonStyles.button} onPress={handleSave}>
            <Text style={commonStyles.buttonText}>Save Changes</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[commonStyles.outlineButton, { borderColor: colors.error }]} onPress={handleLogout}>
          <Text style={[commonStyles.outlineButtonText, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileHeaderText: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  profileType: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  subscriptionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 24,
  },
});
