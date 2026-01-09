
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useUser } from '@/contexts/UserContext';
import { CheckboxItem } from '@/components/CheckboxItem';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import {
  ServiceCategory,
  FinancingType,
  SpokenLanguage,
  CertificationType,
  DoulaProfile,
  DocumentUpload,
  Referee,
} from '@/types';

export default function DoulaRegistrationScreen() {
  const router = useRouter();
  const { setUserProfile } = useUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [paymentPreferences, setPaymentPreferences] = useState<FinancingType[]>([]);
  const [state, setState] = useState('');
  const [town, setTown] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [driveDistance, setDriveDistance] = useState(35);
  const [spokenLanguages, setSpokenLanguages] = useState<SpokenLanguage[]>([]);
  const [hourlyRateMin, setHourlyRateMin] = useState('');
  const [hourlyRateMax, setHourlyRateMax] = useState('');
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [certifications, setCertifications] = useState<CertificationType[]>([]);
  const [profilePicture, setProfilePicture] = useState<DocumentUpload | null>(null);
  const [certificationDocuments, setCertificationDocuments] = useState<DocumentUpload[]>([]);
  const [referees, setReferees] = useState<Referee[]>([
    { firstName: '', lastName: '', email: '' },
  ]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const togglePaymentPreference = (type: FinancingType) => {
    console.log('Toggle payment preference:', type);
    setPaymentPreferences((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleLanguage = (language: SpokenLanguage) => {
    console.log('Toggle language:', language);
    setSpokenLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language]
    );
  };

  const toggleServiceCategory = (category: ServiceCategory) => {
    console.log('Toggle service category:', category);
    setServiceCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleCertification = (cert: CertificationType) => {
    console.log('Toggle certification:', cert);
    setCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  const pickProfilePicture = async () => {
    console.log('Picking profile picture');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      console.log('Profile picture selected:', asset.uri);
      setProfilePicture({
        uri: asset.uri,
        name: asset.fileName || 'profile.jpg',
        type: 'image/jpeg',
        size: asset.fileSize || 0,
      });
    }
  };

  const pickCertificationDocuments = async () => {
    console.log('Picking certification documents');
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets) {
      const newDocs: DocumentUpload[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/pdf',
        size: asset.size || 0,
      }));
      console.log('Certification documents selected:', newDocs.length);
      setCertificationDocuments((prev) => [...prev, ...newDocs].slice(0, 7));
    }
  };

  const removeDocument = (index: number) => {
    console.log('Removing document at index:', index);
    setCertificationDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const addReferee = () => {
    if (referees.length < 3) {
      console.log('Adding referee');
      setReferees([...referees, { firstName: '', lastName: '', email: '' }]);
    }
  };

  const updateReferee = (index: number, field: keyof Referee, value: string) => {
    console.log('Updating referee:', index, field, value);
    const updated = [...referees];
    updated[index][field] = value;
    setReferees(updated);
  };

  const removeReferee = (index: number) => {
    console.log('Removing referee at index:', index);
    setReferees(referees.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    console.log('Submitting doula registration');
    
    if (!firstName || !lastName || !state || !town || !zipCode) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (paymentPreferences.length === 0) {
      Alert.alert('Error', 'Please select at least one payment preference');
      return;
    }

    if (serviceCategories.length === 0) {
      Alert.alert('Error', 'Please select at least one service category');
      return;
    }

    if (!profilePicture) {
      Alert.alert('Error', 'Please upload a profile picture');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Error', 'Please accept the terms and conditions');
      return;
    }

    const profile: DoulaProfile = {
      id: Date.now().toString(),
      userType: 'doula',
      firstName,
      lastName,
      paymentPreferences,
      state,
      town,
      zipCode,
      driveDistance,
      spokenLanguages,
      hourlyRateMin: parseFloat(hourlyRateMin) || 0,
      hourlyRateMax: parseFloat(hourlyRateMax) || 0,
      serviceCategories,
      certifications,
      profilePicture,
      certificationDocuments,
      referees: referees.filter((r) => r.firstName && r.lastName && r.email),
      acceptedTerms,
      subscriptionActive: false,
    };

    console.log('Doula profile created:', profile);
    setUserProfile(profile);
    router.push('/payment');
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={commonStyles.title}>Doula Registration</Text>
        <Text style={styles.subtitle}>
          Complete your profile to connect with new parents
        </Text>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Personal Information</Text>
          
          <Text style={commonStyles.label}>First Name *</Text>
          <TextInput
            style={commonStyles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter your first name"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={commonStyles.label}>Last Name *</Text>
          <TextInput
            style={commonStyles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter your last name"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={commonStyles.label}>State *</Text>
          <TextInput
            style={commonStyles.input}
            value={state}
            onChangeText={setState}
            placeholder="Enter your state"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={commonStyles.label}>Town *</Text>
          <TextInput
            style={commonStyles.input}
            value={town}
            onChangeText={setTown}
            placeholder="Enter your town"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={commonStyles.label}>Zip Code *</Text>
          <TextInput
            style={commonStyles.input}
            value={zipCode}
            onChangeText={setZipCode}
            placeholder="Enter your zip code"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />

          <Text style={commonStyles.label}>Preferred Drive Distance: {driveDistance} miles</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>1 mile</Text>
            <Text style={styles.sliderLabel}>70 miles</Text>
          </View>
          <TextInput
            style={commonStyles.input}
            value={driveDistance.toString()}
            onChangeText={(text) => {
              const value = parseInt(text) || 1;
              setDriveDistance(Math.min(Math.max(value, 1), 70));
            }}
            placeholder="Enter drive distance (1-70 miles)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Payment & Services</Text>
          
          <Text style={commonStyles.label}>Payment Preference *</Text>
          <CheckboxItem
            label="Direct Cash"
            checked={paymentPreferences.includes('self')}
            onPress={() => togglePaymentPreference('self')}
          />
          <CheckboxItem
            label="CARROT Fertility"
            checked={paymentPreferences.includes('carrot')}
            onPress={() => togglePaymentPreference('carrot')}
          />
          <CheckboxItem
            label="Medicaid/MediCal"
            checked={paymentPreferences.includes('medicaid')}
            onPress={() => togglePaymentPreference('medicaid')}
          />

          <Text style={[commonStyles.label, { marginTop: 16 }]}>Hourly Rate (USD)</Text>
          <View style={styles.rateContainer}>
            <View style={{ flex: 1 }}>
              <Text style={commonStyles.label}>Minimum</Text>
              <TextInput
                style={commonStyles.input}
                value={hourlyRateMin}
                onChangeText={setHourlyRateMin}
                placeholder="Min rate"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={commonStyles.label}>Maximum</Text>
              <TextInput
                style={commonStyles.input}
                value={hourlyRateMax}
                onChangeText={setHourlyRateMax}
                placeholder="Max rate"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={commonStyles.label}>Service Categories *</Text>
          <CheckboxItem
            label="Birth Doula"
            checked={serviceCategories.includes('birth')}
            onPress={() => toggleServiceCategory('birth')}
          />
          <CheckboxItem
            label="Postpartum Doula"
            checked={serviceCategories.includes('postpartum')}
            onPress={() => toggleServiceCategory('postpartum')}
          />
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Languages</Text>
          {(['English', 'Spanish', 'Chinese', 'Tagalog', 'Arabic', 'Hebrew', 'Vietnamese'] as SpokenLanguage[]).map((lang) => (
            <CheckboxItem
              key={lang}
              label={lang}
              checked={spokenLanguages.includes(lang)}
              onPress={() => toggleLanguage(lang)}
            />
          ))}
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Certifications</Text>
          <CheckboxItem
            label="Doula Certification"
            checked={certifications.includes('doula_certification')}
            onPress={() => toggleCertification('doula_certification')}
          />
          <CheckboxItem
            label="Basic Life Support"
            checked={certifications.includes('basic_life_support')}
            onPress={() => toggleCertification('basic_life_support')}
          />
          <CheckboxItem
            label="Certificate of Liability Insurance"
            checked={certifications.includes('liability_insurance')}
            onPress={() => toggleCertification('liability_insurance')}
          />
          <CheckboxItem
            label="COVID-19 Immunization"
            checked={certifications.includes('covid_immunization')}
            onPress={() => toggleCertification('covid_immunization')}
          />
          <CheckboxItem
            label="Infant Sleep"
            checked={certifications.includes('infant_sleep')}
            onPress={() => toggleCertification('infant_sleep')}
          />
          <CheckboxItem
            label="Other"
            checked={certifications.includes('other')}
            onPress={() => toggleCertification('other')}
          />
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Profile Picture *</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickProfilePicture}>
            <IconSymbol
              ios_icon_name="camera"
              android_material_icon_name="camera"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.uploadButtonText}>
              {profilePicture ? 'Change Picture' : 'Upload Full-Body Picture'}
            </Text>
          </TouchableOpacity>
          {profilePicture && (
            <Image source={{ uri: profilePicture.uri }} style={styles.profilePreview} />
          )}
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Certification Documents</Text>
          <Text style={styles.helperText}>Upload up to 7 documents (PDF, JPEG, PNG)</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickCertificationDocuments}>
            <IconSymbol
              ios_icon_name="document"
              android_material_icon_name="description"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.uploadButtonText}>Upload Documents</Text>
          </TouchableOpacity>
          {certificationDocuments.map((doc, index) => (
            <View key={index} style={styles.documentItem}>
              <Text style={styles.documentName} numberOfLines={1}>
                {doc.name}
              </Text>
              <TouchableOpacity onPress={() => removeDocument(index)}>
                <IconSymbol
                  ios_icon_name="trash"
                  android_material_icon_name="delete"
                  size={20}
                  color={colors.error}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Referees</Text>
          <Text style={styles.helperText}>Add up to 3 referees</Text>
          {referees.map((referee, index) => (
            <View key={index} style={styles.refereeContainer}>
              <View style={styles.refereeHeader}>
                <Text style={commonStyles.label}>Referee {index + 1}</Text>
                {referees.length > 1 && (
                  <TouchableOpacity onPress={() => removeReferee(index)}>
                    <IconSymbol
                      ios_icon_name="trash"
                      android_material_icon_name="delete"
                      size={20}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={commonStyles.input}
                value={referee.firstName}
                onChangeText={(text) => updateReferee(index, 'firstName', text)}
                placeholder="First name"
                placeholderTextColor={colors.textSecondary}
              />
              <TextInput
                style={commonStyles.input}
                value={referee.lastName}
                onChangeText={(text) => updateReferee(index, 'lastName', text)}
                placeholder="Last name"
                placeholderTextColor={colors.textSecondary}
              />
              <TextInput
                style={commonStyles.input}
                value={referee.email}
                onChangeText={(text) => updateReferee(index, 'email', text)}
                placeholder="Email address"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          ))}
          {referees.length < 3 && (
            <TouchableOpacity style={commonStyles.outlineButton} onPress={addReferee}>
              <Text style={commonStyles.outlineButtonText}>Add Referee</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={commonStyles.card}>
          <CheckboxItem
            label="I accept the terms and conditions of platform use *"
            checked={acceptedTerms}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          />
        </View>

        <TouchableOpacity style={commonStyles.button} onPress={handleSubmit}>
          <Text style={commonStyles.buttonText}>Continue to Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={commonStyles.outlineButton}
          onPress={() => router.back()}
        >
          <Text style={commonStyles.outlineButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rateContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  profilePreview: {
    width: 150,
    height: 150,
    borderRadius: 12,
    alignSelf: 'center',
  },
  helperText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  documentName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  refereeContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  refereeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
});
