
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { DoulaProfile, ParentProfile } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const router = useRouter();
  const { userProfile, setUserProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // Fetch subscription status on mount
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!userProfile) return;
      
      try {
        console.log('[Profile] Fetching subscription status for user:', userProfile.id);
        const { apiGet } = await import('@/utils/api');
        const subscription = await apiGet(`/subscriptions/${userProfile.id}`);
        console.log('[Profile] Subscription status:', subscription);
        setSubscriptionStatus(subscription);
      } catch (error: any) {
        console.error('[Profile] Error fetching subscription:', error);
        // If subscription not found, it means user hasn't subscribed yet
        setSubscriptionStatus(null);
      } finally {
        setLoadingSubscription(false);
      }
    };

    fetchSubscriptionStatus();
  }, [userProfile]);

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
    
    if (!userProfile) return;
    
    try {
      const { apiPut } = await import('@/utils/api');
      
      // Prepare update data based on user type
      const updateData = userProfile.userType === 'parent' 
        ? {
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            state: userProfile.state,
            town: userProfile.town,
            zipCode: userProfile.zipCode,
            serviceCategories: (userProfile as ParentProfile).serviceCategories,
            financingType: (userProfile as ParentProfile).financingType,
            servicePeriodStart: (userProfile as ParentProfile).servicePeriodStart?.toISOString(),
            servicePeriodEnd: (userProfile as ParentProfile).servicePeriodEnd?.toISOString(),
            preferredLanguages: (userProfile as ParentProfile).preferredLanguages,
            desiredDays: (userProfile as ParentProfile).desiredDays,
            desiredStartTime: (userProfile as ParentProfile).desiredStartTime?.toISOString(),
            desiredEndTime: (userProfile as ParentProfile).desiredEndTime?.toISOString(),
          }
        : {
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            state: userProfile.state,
            town: userProfile.town,
            zipCode: userProfile.zipCode,
            paymentPreferences: (userProfile as DoulaProfile).paymentPreferences,
            driveDistance: (userProfile as DoulaProfile).driveDistance,
            spokenLanguages: (userProfile as DoulaProfile).spokenLanguages,
            hourlyRateMin: (userProfile as DoulaProfile).hourlyRateMin,
            hourlyRateMax: (userProfile as DoulaProfile).hourlyRateMax,
            serviceCategories: (userProfile as DoulaProfile).serviceCategories,
            certifications: (userProfile as DoulaProfile).certifications,
          };
      
      const endpoint = userProfile.userType === 'parent' 
        ? `/parents/${userProfile.id}`
        : `/doulas/${userProfile.id}`;
      
      console.log('[Profile] Updating profile at:', endpoint);
      const response = await apiPut(endpoint, updateData);
      console.log('[Profile] Update response:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update profile');
      }
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('[Profile] Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    }
  };

  const handleLogout = async () => {
    console.log('Logging out');
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // Clear user session from storage
            await AsyncStorage.removeItem('doula_connect_user_id');
            await AsyncStorage.removeItem('doula_connect_user_type');
            console.log('[Profile] User session cleared from storage');
            
            setUserProfile(null);
            router.replace('/welcome');
          },
        },
      ]
    );
  };

  const renderParentProfile = (profile: ParentProfile) => {
    const firstNameDisplay = profile.firstName || '';
    const lastNameDisplay = profile.lastName || '';
    const fullName = `${firstNameDisplay} ${lastNameDisplay}`.trim() || 'New Parent';
    const emailDisplay = profile.email || '';
    const townDisplay = profile.town || '';
    const stateDisplay = profile.state || '';
    const zipCodeDisplay = profile.zipCode || '';
    const locationText = `${townDisplay}, ${stateDisplay} ${zipCodeDisplay}`.trim();

    return (
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
              <Text style={styles.profileName}>{fullName}</Text>
              <Text style={styles.profileType}>New Parent</Text>
              {emailDisplay && (
                <Text style={styles.profileEmail}>{emailDisplay}</Text>
              )}
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
            <Text style={styles.infoText}>{locationText}</Text>
          </View>
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Service Requirements</Text>
          <Text style={styles.label}>Service Categories:</Text>
          <View style={styles.badgeContainer}>
            {profile.serviceCategories && profile.serviceCategories.length > 0 ? (
              profile.serviceCategories.map((cat) => {
                const categoryLabel = cat === 'birth' ? 'Birth Doula' : 'Postpartum Doula';
                return (
                  <View key={cat} style={commonStyles.badge}>
                    <Text style={commonStyles.badgeText}>{categoryLabel}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.infoText}>No service categories selected</Text>
            )}
          </View>

          <Text style={styles.label}>Financing Type:</Text>
          <View style={styles.badgeContainer}>
            {profile.financingType && profile.financingType.length > 0 ? (
              profile.financingType.map((fin) => {
                const financingLabel = fin === 'self' ? 'Self Pay' : fin === 'carrot' ? 'CARROT' : 'Medicaid';
                return (
                  <View key={fin} style={commonStyles.badge}>
                    <Text style={commonStyles.badgeText}>{financingLabel}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.infoText}>No financing type selected</Text>
            )}
          </View>

          {profile.servicePeriodStart && profile.servicePeriodEnd && (
            <>
              <Text style={styles.label}>Service Period:</Text>
              <Text style={styles.infoText}>
                {profile.servicePeriodStart.toLocaleDateString()} - {profile.servicePeriodEnd.toLocaleDateString()}
              </Text>
            </>
          )}
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Preferences</Text>
          {profile.preferredLanguages && profile.preferredLanguages.length > 0 && (
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

          {profile.desiredDays && profile.desiredDays.length > 0 && (
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

          {profile.desiredStartTime && profile.desiredEndTime && (
            <>
              <Text style={styles.label}>Desired Hours:</Text>
              <Text style={styles.infoText}>
                {profile.desiredStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {profile.desiredEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </>
          )}
        </View>
      </>
    );
  };

  const renderDoulaProfile = (profile: DoulaProfile) => {
    const firstNameDisplay = profile.firstName || '';
    const lastNameDisplay = profile.lastName || '';
    const fullName = `${firstNameDisplay} ${lastNameDisplay}`.trim() || 'Certified Doula';
    const emailDisplay = profile.email || '';
    const townDisplay = profile.town || '';
    const stateDisplay = profile.state || '';
    const zipCodeDisplay = profile.zipCode || '';
    const locationText = `${townDisplay}, ${stateDisplay} ${zipCodeDisplay}`.trim();
    const driveDistanceDisplay = profile.driveDistance || 0;
    const hourlyRateMinDisplay = profile.hourlyRateMin || 0;
    const hourlyRateMaxDisplay = profile.hourlyRateMax || 0;

    return (
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
              <Text style={styles.profileName}>{fullName}</Text>
              <Text style={styles.profileType}>Certified Doula</Text>
              {emailDisplay && (
                <Text style={styles.profileEmail}>{emailDisplay}</Text>
              )}
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
            <Text style={styles.infoText}>{locationText}</Text>
          </View>
          <Text style={styles.infoText}>Drive distance: up to {driveDistanceDisplay} miles</Text>
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Services & Rates</Text>
          <Text style={styles.label}>Service Categories:</Text>
          <View style={styles.badgeContainer}>
            {profile.serviceCategories && profile.serviceCategories.length > 0 ? (
              profile.serviceCategories.map((cat) => {
                const categoryLabel = cat === 'birth' ? 'Birth Doula' : 'Postpartum Doula';
                return (
                  <View key={cat} style={commonStyles.badge}>
                    <Text style={commonStyles.badgeText}>{categoryLabel}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.infoText}>No service categories selected</Text>
            )}
          </View>

          <Text style={styles.label}>Hourly Rate:</Text>
          <Text style={styles.infoText}>
            ${hourlyRateMinDisplay} - ${hourlyRateMaxDisplay} per hour
          </Text>

          <Text style={styles.label}>Payment Preferences:</Text>
          <View style={styles.badgeContainer}>
            {profile.paymentPreferences && profile.paymentPreferences.length > 0 ? (
              profile.paymentPreferences.map((pref) => {
                const paymentLabel = pref === 'self' ? 'Direct Cash' : pref === 'carrot' ? 'CARROT' : 'Medicaid';
                return (
                  <View key={pref} style={commonStyles.badge}>
                    <Text style={commonStyles.badgeText}>{paymentLabel}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.infoText}>No payment preferences selected</Text>
            )}
          </View>
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Languages & Certifications</Text>
          {profile.spokenLanguages && profile.spokenLanguages.length > 0 && (
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

          {profile.certifications && profile.certifications.length > 0 && (
            <>
              <Text style={styles.label}>Certifications:</Text>
              <View style={styles.badgeContainer}>
                {profile.certifications.map((cert) => {
                  const certLabel = cert.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                  return (
                    <View key={cert} style={[commonStyles.badge, { backgroundColor: colors.secondary }]}>
                      <Text style={commonStyles.badgeText}>{certLabel}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {profile.referees && profile.referees.length > 0 && (
            <>
              <Text style={styles.label}>Referees:</Text>
              {profile.referees.map((referee, index) => {
                const refereeFullName = `${referee.firstName} ${referee.lastName}`.trim();
                const refereeEmail = referee.email;
                return (
                  <View key={index} style={styles.refereeItem}>
                    <Text style={styles.refereeName}>{refereeFullName}</Text>
                    <Text style={styles.refereeEmail}>{refereeEmail}</Text>
                  </View>
                );
              })}
            </>
          )}
        </View>
      </>
    );
  };

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
          {loadingSubscription ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : subscriptionStatus ? (
            <>
              <View style={styles.subscriptionRow}>
                <View style={styles.subscriptionInfo}>
                  <Text style={styles.subscriptionLabel}>Status:</Text>
                  <Text style={[
                    styles.subscriptionValue, 
                    { color: subscriptionStatus.status === 'active' ? colors.success : colors.error }
                  ]}>
                    {subscriptionStatus.status.charAt(0).toUpperCase() + subscriptionStatus.status.slice(1)}
                  </Text>
                </View>
                <View style={styles.subscriptionInfo}>
                  <Text style={styles.subscriptionLabel}>Type:</Text>
                  <Text style={styles.subscriptionValue}>
                    {subscriptionStatus.planType === 'annual' ? 'Annual' : 'Monthly'} - $99
                  </Text>
                </View>
              </View>
              {subscriptionStatus.currentPeriodEnd && (
                <Text style={styles.subscriptionNote}>
                  Renews on: {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
                </Text>
              )}
              <TouchableOpacity style={commonStyles.outlineButton}>
                <Text style={commonStyles.outlineButtonText}>Manage Subscription</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.subscriptionNote}>
                No active subscription found. Subscribe to access all features.
              </Text>
              <TouchableOpacity 
                style={commonStyles.button}
                onPress={() => router.push('/payment')}
              >
                <Text style={commonStyles.buttonText}>Subscribe Now</Text>
              </TouchableOpacity>
            </>
          )}
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
  profileEmail: {
    fontSize: 14,
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
  subscriptionNote: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
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
  refereeItem: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  refereeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  refereeEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
