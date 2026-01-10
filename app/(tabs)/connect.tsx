
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { DoulaProfile, ParentProfile, DoulaComment, CommentEligibility } from '@/types';

// Mock data for demonstration
const mockDoulas: DoulaProfile[] = [
  {
    id: '1',
    userType: 'doula',
    email: 'maria@example.com',
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
    email: 'sarah@example.com',
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
    email: 'jennifer@example.com',
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

// Mock comments data
const mockComments: DoulaComment[] = [
  {
    id: '1',
    contractId: 'contract-1',
    parentId: 'parent-1',
    doulaId: '1',
    parentName: 'Jennifer S.',
    comment: 'Maria was absolutely wonderful! She provided excellent support during our postpartum period. Highly recommend!',
    createdAt: new Date('2024-12-15'),
  },
  {
    id: '2',
    contractId: 'contract-2',
    parentId: 'parent-2',
    doulaId: '1',
    parentName: 'Emily R.',
    comment: 'Very professional and caring. Made our transition to parenthood so much easier.',
    createdAt: new Date('2024-11-20'),
  },
];

export default function ConnectScreen() {
  const { userProfile } = useUser();
  const [selectedProfile, setSelectedProfile] = useState<DoulaProfile | ParentProfile | null>(null);
  const [matches, setMatches] = useState<(DoulaProfile | ParentProfile)[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Comment state
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentEligibility, setCommentEligibility] = useState<Record<string, CommentEligibility>>({});
  const [doulaComments, setDoulaComments] = useState<Record<string, DoulaComment[]>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

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
        
        // TODO: Backend Integration - Fetch matches from API
        // Expected endpoint: GET /api/matches?userId={userId}&userType={userType}
        // Expected response: { matches: Array<DoulaProfile | ParentProfile> }
        
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

  // Fetch comment eligibility and existing comments for each doula (parents only)
  useEffect(() => {
    const fetchCommentData = async () => {
      if (!isParent || !userProfile || matches.length === 0) {
        return;
      }

      try {
        console.log('[Connect] Fetching comment eligibility for doulas');
        
        // TODO: Backend Integration - Check comment eligibility for each doula
        // Expected endpoint: GET /api/contracts/comment-eligibility?parentId={parentId}&doulaId={doulaId}
        // Expected response: CommentEligibility object
        
        // TODO: Backend Integration - Fetch existing comments for each doula
        // Expected endpoint: GET /api/comments/doula/{doulaId}
        // Expected response: { comments: DoulaComment[] }
        
        // Mock implementation
        const eligibilityMap: Record<string, CommentEligibility> = {};
        const commentsMap: Record<string, DoulaComment[]> = {};
        
        for (const match of matches) {
          const doulaId = match.id;
          
          // Mock eligibility - simulate that user can comment on first doula
          if (doulaId === '1') {
            eligibilityMap[doulaId] = {
              canComment: true,
              contractId: 'contract-123',
              message: 'You can leave a comment for this doula',
            };
          } else {
            eligibilityMap[doulaId] = {
              canComment: false,
              daysUntilEligible: 3,
              message: 'You can comment 3 days after contract start',
            };
          }
          
          // Mock comments
          commentsMap[doulaId] = mockComments.filter(c => c.doulaId === doulaId);
        }
        
        setCommentEligibility(eligibilityMap);
        setDoulaComments(commentsMap);
      } catch (error) {
        console.error('[Connect] Error fetching comment data:', error);
      }
    };

    fetchCommentData();
  }, [isParent, userProfile, matches]);

  const handleStartContract = async (doulaId: string) => {
    if (!userProfile) return;

    try {
      console.log('[Connect] Starting contract with doula:', doulaId);
      
      // TODO: Backend Integration - Create job contract
      // Expected endpoint: POST /api/contracts
      // Expected body: { parentId: string, doulaId: string, startDate: Date }
      // Expected response: { success: boolean, contract: JobContract }
      
      Alert.alert(
        'Contract Started',
        'Your contract has been started. You can leave a comment after 7 days.',
        [{ text: 'OK' }]
      );
      
      // Refresh eligibility
      setCommentEligibility(prev => ({
        ...prev,
        [doulaId]: {
          canComment: false,
          daysUntilEligible: 7,
          message: 'You can comment in 7 days',
        },
      }));
    } catch (error) {
      console.error('[Connect] Error starting contract:', error);
      Alert.alert('Error', 'Failed to start contract. Please try again.');
    }
  };

  const handleSubmitComment = async (doulaId: string) => {
    if (!userProfile || !commentText.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    if (commentText.length > 160) {
      Alert.alert('Error', 'Comment must be 160 characters or less');
      return;
    }

    const eligibility = commentEligibility[doulaId];
    if (!eligibility?.canComment) {
      Alert.alert('Error', 'You are not eligible to comment yet');
      return;
    }

    setSubmittingComment(true);
    try {
      console.log('[Connect] Submitting comment for doula:', doulaId);
      
      // TODO: Backend Integration - Submit comment
      // Expected endpoint: POST /api/comments
      // Expected body: { contractId: string, doulaId: string, comment: string }
      // Expected response: { success: boolean, comment: DoulaComment }
      
      // Mock implementation - add comment locally
      const newComment: DoulaComment = {
        id: `comment-${Date.now()}`,
        contractId: eligibility.contractId || '',
        parentId: userProfile.id,
        doulaId: doulaId,
        parentName: `${userProfile.firstName} ${userProfile.lastName.charAt(0)}.`,
        comment: commentText,
        createdAt: new Date(),
      };
      
      setDoulaComments(prev => ({
        ...prev,
        [doulaId]: [...(prev[doulaId] || []), newComment],
      }));
      
      setCommentEligibility(prev => ({
        ...prev,
        [doulaId]: {
          canComment: false,
          hasExistingComment: true,
          message: 'You have already commented on this contract',
        },
      }));
      
      setCommentText('');
      Alert.alert('Success', 'Your comment has been posted!');
    } catch (error) {
      console.error('[Connect] Error submitting comment:', error);
      Alert.alert('Error', 'Failed to submit comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const toggleComments = (doulaId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [doulaId]: !prev[doulaId],
    }));
  };

  const renderCommentSection = (doulaId: string) => {
    const eligibility = commentEligibility[doulaId];
    const comments = doulaComments[doulaId] || [];
    const isExpanded = expandedComments[doulaId];

    return (
      <View style={styles.commentSection}>
        {/* Comment Input (only if eligible) */}
        {eligibility?.canComment && (
          <View style={styles.commentInputContainer}>
            <Text style={styles.commentInputLabel}>Leave a comment about your experience:</Text>
            <View style={styles.textInputWrapper}>
              <TextInput
                style={styles.commentInput}
                placeholder="Share your experience (max 160 characters)"
                placeholderTextColor={colors.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                maxLength={160}
                multiline
                numberOfLines={3}
                editable={!submittingComment}
              />
              <Text style={styles.characterCount}>
                {commentText.length}/160
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!commentText.trim() || submittingComment) && styles.submitButtonDisabled,
              ]}
              onPress={() => handleSubmitComment(doulaId)}
              disabled={!commentText.trim() || submittingComment}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.submitButtonText}>Submit Comment</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Eligibility Message (if not eligible) */}
        {eligibility && !eligibility.canComment && (
          <View style={styles.eligibilityMessage}>
            <IconSymbol
              ios_icon_name="info.circle"
              android_material_icon_name="info"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.eligibilityText}>{eligibility.message}</Text>
          </View>
        )}

        {/* Start Contract Button (if no contract exists) */}
        {!eligibility && (
          <TouchableOpacity
            style={styles.startContractButton}
            onPress={() => handleStartContract(doulaId)}
          >
            <IconSymbol
              ios_icon_name="doc.text"
              android_material_icon_name="description"
              size={20}
              color={colors.background}
            />
            <Text style={styles.startContractButtonText}>Start Contract</Text>
          </TouchableOpacity>
        )}

        {/* Existing Comments */}
        {comments.length > 0 && (
          <View style={styles.commentsContainer}>
            <TouchableOpacity
              style={styles.commentsHeader}
              onPress={() => toggleComments(doulaId)}
            >
              <Text style={styles.commentsHeaderText}>
                Comments ({comments.length})
              </Text>
              <IconSymbol
                ios_icon_name={isExpanded ? 'chevron.up' : 'chevron.down'}
                android_material_icon_name={isExpanded ? 'expand-less' : 'expand-more'}
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
            
            {isExpanded && (
              <View style={styles.commentsList}>
                {comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentAuthor}>{comment.parentName}</Text>
                      <Text style={styles.commentDate}>
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.commentText}>{comment.comment}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderDoulaCard = (doula: DoulaProfile) => (
    <View key={doula.id} style={commonStyles.card}>
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

      {/* Comment Section for Parents */}
      {isParent && renderCommentSection(doula.id)}
    </View>
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
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
      </KeyboardAvoidingView>
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
  // Comment Section Styles
  commentSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  commentInputContainer: {
    marginBottom: 16,
  },
  commentInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInputWrapper: {
    position: 'relative',
  },
  commentInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  characterCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 12,
    color: colors.textSecondary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  eligibilityMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  eligibilityText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  startContractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  startContractButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  commentsContainer: {
    marginTop: 12,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  commentsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  commentsList: {
    marginTop: 8,
  },
  commentItem: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  commentDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  commentText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});
