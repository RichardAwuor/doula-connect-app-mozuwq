
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { DoulaProfile, ParentProfile } from '@/types';

// Mock data for demonstration
const mockDoulas: DoulaProfile[] = [
  {
    id: '1',
    userType: 'doula',
    firstName: 'Maria',
    lastName: 'Rodriguez',
    paymentPreferences: ['self', 'carrot'],
    state: 'California',
    town: 'Los Angeles',
    zipCode: '90001',
    driveDistance: 50,
    spokenLanguages: ['English', 'Spanish'],
    hourlyRateMin: 35,
    hourlyRateMax: 55,
    serviceCategories: ['birth', 'postpartum'],
    certifications: ['doula_certification', 'basic_life_support', 'covid_immunization'],
    profilePicture: { uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', name: 'profile.jpg', type: 'image/jpeg', size: 0 },
    certificationDocuments: [],
    referees: [],
    acceptedTerms: true,
    subscriptionActive: true,
    rating: 4.8,
    reviewCount: 24,
  },
  {
    id: '2',
    userType: 'doula',
    firstName: 'Sarah',
    lastName: 'Johnson',
    paymentPreferences: ['medicaid', 'self'],
    state: 'California',
    town: 'San Diego',
    zipCode: '92101',
    driveDistance: 40,
    spokenLanguages: ['English'],
    hourlyRateMin: 40,
    hourlyRateMax: 60,
    serviceCategories: ['postpartum'],
    certifications: ['doula_certification', 'infant_sleep', 'liability_insurance'],
    profilePicture: { uri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', name: 'profile.jpg', type: 'image/jpeg', size: 0 },
    certificationDocuments: [],
    referees: [],
    acceptedTerms: true,
    subscriptionActive: true,
    rating: 4.9,
    reviewCount: 31,
  },
];

const mockParents: ParentProfile[] = [
  {
    id: '1',
    userType: 'parent',
    firstName: 'Jennifer',
    lastName: 'Smith',
    state: 'California',
    town: 'Los Angeles',
    zipCode: '90002',
    serviceCategories: ['postpartum'],
    financingType: ['carrot'],
    servicePeriodStart: new Date('2025-02-01'),
    servicePeriodEnd: new Date('2025-05-01'),
    preferredLanguages: ['English'],
    desiredDays: ['Monday', 'Wednesday', 'Friday'],
    desiredStartTime: new Date('2025-01-01T09:00:00'),
    desiredEndTime: new Date('2025-01-01T17:00:00'),
    acceptedTerms: true,
    subscriptionActive: true,
  },
];

export default function ConnectScreen() {
  const { userProfile } = useUser();
  const [selectedProfile, setSelectedProfile] = useState<DoulaProfile | ParentProfile | null>(null);
  const [matches, setMatches] = useState<(DoulaProfile | ParentProfile)[]>([]);
  const [loading, setLoading] = useState(true);

  const isParent = userProfile?.userType === 'parent';

  // Fetch matches from backend
  useEffect(() => {
    const fetchMatches = async () => {
      if (!userProfile) {
        console.log('[Connect] No user profile');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('[Connect] Fetching matches for user:', userProfile.id);
        
        // Backend Integration: Fetch matches from API
        // Note: This endpoint needs to be implemented on the backend
        // Expected endpoint: GET /api/matches?userId={userId}&userType={userType}
        // Expected response: { matches: Array<DoulaProfile | ParentProfile> }
        
        // For now, using mock implementation until backend endpoint is ready
        // Uncomment below when backend is ready:
        /*
        const { apiGet } = await import('@/utils/api');
        const response = await apiGet(
          `/api/matches?userId=${userProfile.id}&userType=${userProfile.userType}`
        );
        console.log('[Connect] Matches fetched:', response.matches.length);
        setMatches(response.matches);
        */
        
        // Mock implementation - filter local data
        if (isParent) {
          const parentProfile = userProfile as ParentProfile;
          const filteredDoulas = mockDoulas.filter((doula) => {
            const categoryMatch = doula.serviceCategories.some((cat) =>
              parentProfile.serviceCategories.includes(cat)
            );
            const paymentMatch = doula.paymentPreferences.some((pref) =>
              parentProfile.financingType.includes(pref)
            );
            console.log('[Connect] Doula match:', doula.firstName, 'category:', categoryMatch, 'payment:', paymentMatch);
            return categoryMatch && paymentMatch;
          });
          setMatches(filteredDoulas);
        } else {
          const doulaProfile = userProfile as DoulaProfile;
          const filteredParents = mockParents.filter((parent) => {
            const categoryMatch = parent.serviceCategories.some((cat) =>
              doulaProfile.serviceCategories.includes(cat)
            );
            const paymentMatch = parent.financingType.some((fin) =>
              doulaProfile.paymentPreferences.includes(fin)
            );
            console.log('[Connect] Parent match:', parent.firstName, 'category:', categoryMatch, 'payment:', paymentMatch);
            return categoryMatch && paymentMatch;
          });
          setMatches(filteredParents);
        }
      } catch (error) {
        console.error('[Connect] Error fetching matches:', error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [userProfile, isParent]);

  const renderDoulaCard = (doula: DoulaProfile) => (
    <TouchableOpacity
      key={doula.id}
      style={commonStyles.card}
      onPress={() => {
        console.log('Selected doula:', doula.firstName);
        setSelectedProfile(doula);
      }}
    >
      <View style={styles.cardHeader}>
        {doula.profilePicture && (
          <Image source={{ uri: doula.profilePicture.uri }} style={styles.profileImage} />
        )}
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardName}>
            {doula.firstName} {doula.lastName}
          </Text>
          <View style={styles.ratingContainer}>
            <IconSymbol
              ios_icon_name="star.fill"
              android_material_icon_name="star"
              size={16}
              color={colors.accent}
            />
            <Text style={styles.ratingText}>
              {doula.rating} ({doula.reviewCount} reviews)
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoRow}>
        <IconSymbol
          ios_icon_name="location"
          android_material_icon_name="location-on"
          size={16}
          color={colors.textSecondary}
        />
        <Text style={styles.infoText}>
          {doula.town}, {doula.state}
        </Text>
      </View>

      <View style={styles.badgeContainer}>
        {doula.serviceCategories.map((cat) => (
          <View key={cat} style={commonStyles.badge}>
            <Text style={commonStyles.badgeText}>
              {cat === 'birth' ? 'Birth Doula' : 'Postpartum Doula'}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.infoRow}>
        <IconSymbol
          ios_icon_name="dollarsign"
          android_material_icon_name="payment"
          size={16}
          color={colors.textSecondary}
        />
        <Text style={styles.infoText}>
          ${doula.hourlyRateMin} - ${doula.hourlyRateMax}/hour
        </Text>
      </View>

      <View style={styles.infoRow}>
        <IconSymbol
          ios_icon_name="globe"
          android_material_icon_name="language"
          size={16}
          color={colors.textSecondary}
        />
        <Text style={styles.infoText}>{doula.spokenLanguages.join(', ')}</Text>
      </View>

      <View style={styles.badgeContainer}>
        {doula.certifications.slice(0, 3).map((cert) => (
          <View key={cert} style={[commonStyles.badge, { backgroundColor: colors.secondary }]}>
            <Text style={commonStyles.badgeText}>
              {cert.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderParentCard = (parent: ParentProfile) => (
    <TouchableOpacity
      key={parent.id}
      style={commonStyles.card}
      onPress={() => {
        console.log('Selected parent:', parent.firstName);
        setSelectedProfile(parent);
      }}
    >
      <Text style={styles.cardName}>
        {parent.firstName} {parent.lastName}
      </Text>

      <View style={styles.infoRow}>
        <IconSymbol
          ios_icon_name="location"
          android_material_icon_name="location-on"
          size={16}
          color={colors.textSecondary}
        />
        <Text style={styles.infoText}>
          {parent.town}, {parent.state}
        </Text>
      </View>

      <View style={styles.badgeContainer}>
        {parent.serviceCategories.map((cat) => (
          <View key={cat} style={commonStyles.badge}>
            <Text style={commonStyles.badgeText}>
              {cat === 'birth' ? 'Birth Doula' : 'Postpartum Doula'}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.infoRow}>
        <IconSymbol
          ios_icon_name="calendar"
          android_material_icon_name="calendar-today"
          size={16}
          color={colors.textSecondary}
        />
        <Text style={styles.infoText}>
          {parent.servicePeriodStart?.toLocaleDateString()} -{' '}
          {parent.servicePeriodEnd?.toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <IconSymbol
          ios_icon_name="clock"
          android_material_icon_name="access-time"
          size={16}
          color={colors.textSecondary}
        />
        <Text style={styles.infoText}>
          {parent.desiredStartTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
          {parent.desiredEndTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.badgeContainer}>
        {parent.desiredDays.slice(0, 3).map((day) => (
          <View key={day} style={[commonStyles.badge, { backgroundColor: colors.secondary }]}>
            <Text style={commonStyles.badgeText}>{day}</Text>
          </View>
        ))}
        {parent.desiredDays.length > 3 && (
          <View style={[commonStyles.badge, { backgroundColor: colors.secondary }]}>
            <Text style={commonStyles.badgeText}>+{parent.desiredDays.length - 3} more</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!userProfile) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Please complete your registration</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Finding matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={commonStyles.title}>Connect</Text>
        <Text style={styles.subtitle}>
          {isParent
            ? 'Find certified doulas that match your needs'
            : 'Find families looking for doula services'}
        </Text>

        {matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="heart"
              android_material_icon_name="favorite-border"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No matches found</Text>
            <Text style={styles.emptySubtext}>
              Check back later for new {isParent ? 'doulas' : 'families'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.matchCount}>
              {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
            </Text>
            {matches.map((match) =>
              isParent ? renderDoulaCard(match as DoulaProfile) : renderParentCard(match as ParentProfile)
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  matchCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  cardHeaderText: {
    flex: 1,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
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
    fontSize: 14,
    color: colors.text,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
});
