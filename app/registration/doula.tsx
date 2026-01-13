
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
import DropdownPicker from '@/components/DropdownPicker';
import { getStates, getCitiesByState, getZipCodesByCity } from '@/constants/usLocations';
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
  const { userEmail, language, setUserProfile } = useUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [paymentPreferences, setPaymentPreferences] = useState<FinancingType[]>([]);
  const [state, setState] = useState('');
  const [town, setTown] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [driveDistance, setDriveDistance] = useState(25);
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

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      title: { en: 'Doula Registration', es: 'Registro de Doula' },
      subtitle: { en: 'Complete your profile to connect with new parents', es: 'Complete su perfil para conectarse con nuevos padres' },
      personalInfo: { en: 'Personal Information', es: 'Información Personal' },
      firstName: { en: 'First Name', es: 'Nombre' },
      lastName: { en: 'Last Name', es: 'Apellido' },
      state: { en: 'State', es: 'Estado' },
      town: { en: 'Town', es: 'Ciudad' },
      zipCode: { en: 'Zip Code', es: 'Código Postal' },
      selectState: { en: 'Select State', es: 'Seleccionar Estado' },
      selectTown: { en: 'Select Town', es: 'Seleccionar Ciudad' },
      selectZip: { en: 'Select Zip Code', es: 'Seleccionar Código Postal' },
      driveDistance: { en: 'Preferred Drive Distance', es: 'Distancia de Conducción Preferida' },
      paymentServices: { en: 'Payment & Services', es: 'Pago y Servicios' },
      paymentPref: { en: 'Payment Preference', es: 'Preferencia de Pago' },
      directCash: { en: 'Direct Cash', es: 'Efectivo Directo' },
      carrot: { en: 'CARROT Fertility', es: 'CARROT Fertility' },
      medicaid: { en: 'Medicaid/MediCal', es: 'Medicaid/MediCal' },
      hourlyRate: { en: 'Hourly Rate (USD)', es: 'Tarifa por Hora (USD)' },
      minimum: { en: 'Minimum', es: 'Mínimo' },
      maximum: { en: 'Maximum', es: 'Máximo' },
      serviceCategories: { en: 'Service Categories', es: 'Categorías de Servicio' },
      birthDoula: { en: 'Birth Doula', es: 'Doula de Parto' },
      postpartumDoula: { en: 'Postpartum Doula', es: 'Doula Posparto' },
      languages: { en: 'Languages', es: 'Idiomas' },
      certifications: { en: 'Certifications', es: 'Certificaciones' },
      doulaCert: { en: 'Doula Certification', es: 'Certificación de Doula' },
      basicLife: { en: 'Basic Life Support', es: 'Soporte Vital Básico' },
      liability: { en: 'Certificate of Liability Insurance', es: 'Certificado de Seguro de Responsabilidad' },
      covid: { en: 'COVID-19 Immunization', es: 'Inmunización COVID-19' },
      infantSleep: { en: 'Infant Sleep', es: 'Sueño Infantil' },
      other: { en: 'Other', es: 'Otro' },
      profilePic: { en: 'Profile Picture', es: 'Foto de Perfil' },
      uploadPic: { en: 'Upload Full-Body Picture', es: 'Subir Foto de Cuerpo Completo' },
      changePic: { en: 'Change Picture', es: 'Cambiar Foto' },
      certDocs: { en: 'Certification Documents', es: 'Documentos de Certificación' },
      uploadDocs: { en: 'Upload Documents', es: 'Subir Documentos' },
      docsHelper: { en: 'Upload up to 7 documents (PDF, JPEG, PNG)', es: 'Sube hasta 7 documentos (PDF, JPEG, PNG)' },
      referees: { en: 'Referees', es: 'Referencias' },
      refereesHelper: { en: 'Add up to 3 referees', es: 'Agrega hasta 3 referencias' },
      referee: { en: 'Referee', es: 'Referencia' },
      addReferee: { en: 'Add Referee', es: 'Agregar Referencia' },
      terms: { en: 'I accept the terms and conditions of platform use', es: 'Acepto los términos y condiciones de uso de la plataforma' },
      continue: { en: 'Continue to Payment', es: 'Continuar al Pago' },
      back: { en: 'Back', es: 'Atrás' },
    };
    return translations[key]?.[language] || key;
  };

  const togglePaymentPreference = (type: FinancingType) => {
    console.log('Toggle payment preference:', type);
    setPaymentPreferences((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleLanguage = (lang: SpokenLanguage) => {
    console.log('Toggle language:', lang);
    setSpokenLanguages((prev) =>
      prev.includes(lang)
        ? prev.filter((l) => l !== lang)
        : [...prev, lang]
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

  const handleStateChange = (newState: string) => {
    console.log('State changed:', newState);
    setState(newState);
    // Reset town and zip code when state changes
    setTown('');
    setZipCode('');
  };

  const handleTownChange = (newTown: string) => {
    console.log('Town changed:', newTown);
    setTown(newTown);
    // Reset zip code when town changes
    setZipCode('');
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

  const handleSubmit = async () => {
    console.log('[Registration] Submitting doula registration');
    
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

    try {
      const { apiPost } = await import('@/utils/api');
      
      // Note: File uploads are not implemented in the backend yet
      // Using local URIs for now
      const profilePictureUrl = profilePicture.uri;
      const certificationUrls = certificationDocuments.map(doc => doc.uri);
      
      const registrationData = {
        email: userEmail || '',
        firstName,
        lastName,
        state,
        town,
        zipCode,
        paymentPreferences,
        driveDistance,
        spokenLanguages,
        hourlyRateMin: parseFloat(hourlyRateMin) || 0,
        hourlyRateMax: parseFloat(hourlyRateMax) || 0,
        serviceCategories,
        certifications,
        profilePictureUrl,
        certificationDocuments: certificationUrls,
        referees: referees.filter((r) => r.firstName && r.lastName && r.email),
        acceptedTerms,
      };
      
      console.log('[Registration] Sending doula registration data:', registrationData);
      
      // Call backend API to register doula
      const response = await apiPost('/auth/register-doula', registrationData);
      console.log('[Registration] Doula registered:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to register doula');
      }
      
      // Create profile object with response data
      const profile: DoulaProfile = {
        id: response.userId,
        userType: 'doula',
        email: userEmail || '',
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
        profilePicture: { ...profilePicture, uri: profilePictureUrl },
        certificationDocuments: certificationDocuments.map((doc, i) => ({
          ...doc,
          uri: certificationUrls[i] || doc.uri,
        })),
        referees: referees.filter((r) => r.firstName && r.lastName && r.email),
        acceptedTerms,
        subscriptionActive: false,
      };
      
      setUserProfile(profile);
      router.push('/payment');
    } catch (error: any) {
      console.error('[Registration] Error creating doula profile:', error);
      Alert.alert('Error', error.message || 'Failed to create profile. Please try again.');
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol 
              ios_icon_name="chevron.left" 
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <Text style={commonStyles.title}>{t('title')}</Text>
        <Text style={styles.subtitle}>{t('subtitle')}</Text>

        {userEmail && (
          <View style={styles.emailBadge}>
            <IconSymbol 
              ios_icon_name="envelope.fill" 
              android_material_icon_name="email"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.emailText}>{userEmail}</Text>
          </View>
        )}

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>{t('personalInfo')}</Text>
          
          <Text style={commonStyles.label}>{t('firstName')} *</Text>
          <TextInput
            style={commonStyles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t('firstName')}
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={commonStyles.label}>{t('lastName')} *</Text>
          <TextInput
            style={commonStyles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t('lastName')}
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={commonStyles.label}>{t('state')} *</Text>
          <DropdownPicker
            options={getStates()}
            value={state}
            onValueChange={handleStateChange}
            placeholder={t('selectState')}
            searchable={true}
          />

          <Text style={commonStyles.label}>{t('town')} *</Text>
          <DropdownPicker
            options={getCitiesByState(state)}
            value={town}
            onValueChange={handleTownChange}
            placeholder={t('selectTown')}
            searchable={true}
            disabled={!state}
          />

          <Text style={commonStyles.label}>{t('zipCode')} *</Text>
          <DropdownPicker
            options={getZipCodesByCity(state, town)}
            value={zipCode}
            onValueChange={setZipCode}
            placeholder={t('selectZip')}
            searchable={true}
            disabled={!town}
          />

          <Text style={commonStyles.label}>{t('driveDistance')}: {driveDistance} miles</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>1 mile</Text>
            <Text style={styles.sliderLabel}>50 miles</Text>
          </View>
          <TextInput
            style={commonStyles.input}
            value={driveDistance.toString()}
            onChangeText={(text) => {
              const value = parseInt(text) || 1;
              setDriveDistance(Math.min(Math.max(value, 1), 50));
            }}
            placeholder="Enter drive distance (1-50 miles)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>{t('paymentServices')}</Text>
          
          <Text style={commonStyles.label}>{t('paymentPref')} *</Text>
          <CheckboxItem
            label={t('directCash')}
            checked={paymentPreferences.includes('self')}
            onPress={() => togglePaymentPreference('self')}
          />
          <CheckboxItem
            label={t('carrot')}
            checked={paymentPreferences.includes('carrot')}
            onPress={() => togglePaymentPreference('carrot')}
          />
          <CheckboxItem
            label={t('medicaid')}
            checked={paymentPreferences.includes('medicaid')}
            onPress={() => togglePaymentPreference('medicaid')}
          />

          <Text style={[commonStyles.label, { marginTop: 16 }]}>{t('hourlyRate')}</Text>
          <View style={styles.rateContainer}>
            <View style={{ flex: 1 }}>
              <Text style={commonStyles.label}>{t('minimum')}</Text>
              <TextInput
                style={commonStyles.input}
                value={hourlyRateMin}
                onChangeText={setHourlyRateMin}
                placeholder="Min"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={commonStyles.label}>{t('maximum')}</Text>
              <TextInput
                style={commonStyles.input}
                value={hourlyRateMax}
                onChangeText={setHourlyRateMax}
                placeholder="Max"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={commonStyles.label}>{t('serviceCategories')} *</Text>
          <CheckboxItem
            label={t('birthDoula')}
            checked={serviceCategories.includes('birth')}
            onPress={() => toggleServiceCategory('birth')}
          />
          <CheckboxItem
            label={t('postpartumDoula')}
            checked={serviceCategories.includes('postpartum')}
            onPress={() => toggleServiceCategory('postpartum')}
          />
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>{t('languages')}</Text>
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
          <Text style={commonStyles.subtitle}>{t('certifications')}</Text>
          <CheckboxItem
            label={t('doulaCert')}
            checked={certifications.includes('doula_certification')}
            onPress={() => toggleCertification('doula_certification')}
          />
          <CheckboxItem
            label={t('basicLife')}
            checked={certifications.includes('basic_life_support')}
            onPress={() => toggleCertification('basic_life_support')}
          />
          <CheckboxItem
            label={t('liability')}
            checked={certifications.includes('liability_insurance')}
            onPress={() => toggleCertification('liability_insurance')}
          />
          <CheckboxItem
            label={t('covid')}
            checked={certifications.includes('covid_immunization')}
            onPress={() => toggleCertification('covid_immunization')}
          />
          <CheckboxItem
            label={t('infantSleep')}
            checked={certifications.includes('infant_sleep')}
            onPress={() => toggleCertification('infant_sleep')}
          />
          <CheckboxItem
            label={t('other')}
            checked={certifications.includes('other')}
            onPress={() => toggleCertification('other')}
          />
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>{t('profilePic')} *</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickProfilePicture}>
            <IconSymbol
              ios_icon_name="camera"
              android_material_icon_name="camera"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.uploadButtonText}>
              {profilePicture ? t('changePic') : t('uploadPic')}
            </Text>
          </TouchableOpacity>
          {profilePicture && (
            <Image source={{ uri: profilePicture.uri }} style={styles.profilePreview} />
          )}
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>{t('certDocs')}</Text>
          <Text style={styles.helperText}>{t('docsHelper')}</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickCertificationDocuments}>
            <IconSymbol
              ios_icon_name="document"
              android_material_icon_name="description"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.uploadButtonText}>{t('uploadDocs')}</Text>
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
          <Text style={commonStyles.subtitle}>{t('referees')}</Text>
          <Text style={styles.helperText}>{t('refereesHelper')}</Text>
          {referees.map((referee, index) => (
            <View key={index} style={styles.refereeContainer}>
              <View style={styles.refereeHeader}>
                <Text style={commonStyles.label}>{t('referee')} {index + 1}</Text>
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
                placeholder={t('firstName')}
                placeholderTextColor={colors.textSecondary}
              />
              <TextInput
                style={commonStyles.input}
                value={referee.lastName}
                onChangeText={(text) => updateReferee(index, 'lastName', text)}
                placeholder={t('lastName')}
                placeholderTextColor={colors.textSecondary}
              />
              <TextInput
                style={commonStyles.input}
                value={referee.email}
                onChangeText={(text) => updateReferee(index, 'email', text)}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          ))}
          {referees.length < 3 && (
            <TouchableOpacity style={commonStyles.outlineButton} onPress={addReferee}>
              <Text style={commonStyles.outlineButtonText}>{t('addReferee')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={commonStyles.card}>
          <CheckboxItem
            label={`${t('terms')} *`}
            checked={acceptedTerms}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          />
        </View>

        <TouchableOpacity style={commonStyles.button} onPress={handleSubmit}>
          <Text style={commonStyles.buttonText}>{t('continue')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  emailText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
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
