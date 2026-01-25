
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from '@/contexts/UserContext';
import { CheckboxItem } from '@/components/CheckboxItem';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import DropdownPicker from '@/components/DropdownPicker';
import { getStates, getCitiesByState, getZipCodesByCity } from '@/constants/usLocations';
import {
  ServiceCategory,
  FinancingType,
  SpokenLanguage,
  DayOfWeek,
  ParentProfile,
} from '@/types';

export default function ParentRegistrationScreen() {
  const router = useRouter();
  const { userEmail, language, setUserProfile } = useUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [state, setState] = useState('');
  const [town, setTown] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [financingTypes, setFinancingTypes] = useState<FinancingType[]>([]);
  const [servicePeriodStart, setServicePeriodStart] = useState<Date | null>(null);
  const [servicePeriodEnd, setServicePeriodEnd] = useState<Date | null>(null);
  const [preferredLanguages, setPreferredLanguages] = useState<SpokenLanguage[]>([]);
  const [desiredDays, setDesiredDays] = useState<DayOfWeek[]>([]);
  const [desiredStartTime, setDesiredStartTime] = useState<Date | null>(null);
  const [desiredEndTime, setDesiredEndTime] = useState<Date | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      title: { en: 'New Parent Registration', es: 'Registro de Nuevo Padre' },
      subtitle: { en: 'Complete your profile to connect with certified doulas', es: 'Complete su perfil para conectarse con doulas certificadas' },
      personalInfo: { en: 'Personal Information', es: 'Información Personal' },
      firstName: { en: 'First Name', es: 'Nombre' },
      lastName: { en: 'Last Name', es: 'Apellido' },
      state: { en: 'State', es: 'Estado' },
      town: { en: 'Town', es: 'Ciudad' },
      zipCode: { en: 'Zip Code', es: 'Código Postal' },
      selectState: { en: 'Select State', es: 'Seleccionar Estado' },
      selectTown: { en: 'Select Town', es: 'Seleccionar Ciudad' },
      selectZip: { en: 'Select Zip Code', es: 'Seleccionar Código Postal' },
      serviceReq: { en: 'Service Requirements', es: 'Requisitos del Servicio' },
      serviceCategory: { en: 'Service Category', es: 'Categoría de Servicio' },
      birthDoula: { en: 'Birth Doula', es: 'Doula de Parto' },
      postpartumDoula: { en: 'Postpartum Doula', es: 'Doula Posparto' },
      financingType: { en: 'Financing Type', es: 'Tipo de Financiamiento' },
      selfPay: { en: 'Self/Out-Of-Pocket', es: 'Pago Propio' },
      carrot: { en: 'CARROT Fertility', es: 'CARROT Fertility' },
      medicaid: { en: 'Medicaid/MediCal', es: 'Medicaid/MediCal' },
      servicePeriod: { en: 'Service Period', es: 'Período de Servicio' },
      startDate: { en: 'Start Date', es: 'Fecha de Inicio' },
      endDate: { en: 'End Date', es: 'Fecha de Fin' },
      preferences: { en: 'Preferences', es: 'Preferencias' },
      preferredLang: { en: 'Preferred Languages', es: 'Idiomas Preferidos' },
      desiredDays: { en: 'Desired Service Days', es: 'Días de Servicio Deseados' },
      desiredHours: { en: 'Desired Service Hours', es: 'Horas de Servicio Deseadas' },
      startTime: { en: 'Start Time', es: 'Hora de Inicio' },
      endTime: { en: 'End Time', es: 'Hora de Fin' },
      terms: { en: 'I accept the terms and conditions of platform use', es: 'Acepto los términos y condiciones de uso de la plataforma' },
      continue: { en: 'Continue to Payment', es: 'Continuar al Pago' },
      back: { en: 'Back', es: 'Atrás' },
      missingFieldsTitle: { en: 'Missing Required Fields', es: 'Campos Requeridos Faltantes' },
      missingFieldsMessage: { en: 'Please fill in the following required fields:', es: 'Por favor complete los siguientes campos requeridos:' },
    };
    return translations[key]?.[language] || key;
  };

  const toggleServiceCategory = (category: ServiceCategory) => {
    console.log('Toggle service category:', category);
    setServiceCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleFinancingType = (type: FinancingType) => {
    console.log('Toggle financing type:', type);
    setFinancingTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleLanguage = (lang: SpokenLanguage) => {
    console.log('Toggle language:', lang);
    setPreferredLanguages((prev) =>
      prev.includes(lang)
        ? prev.filter((l) => l !== lang)
        : [...prev, lang]
    );
  };

  const toggleDay = (day: DayOfWeek) => {
    console.log('Toggle day:', day);
    setDesiredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
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

  const handleSubmit = async () => {
    console.log('[Registration] Submitting parent registration');
    
    // Collect all missing required fields
    const missingFields: string[] = [];
    
    if (!firstName) missingFields.push(t('firstName'));
    if (!lastName) missingFields.push(t('lastName'));
    if (!state) missingFields.push(t('state'));
    if (!town) missingFields.push(t('town'));
    if (!zipCode) missingFields.push(t('zipCode'));
    if (serviceCategories.length === 0) missingFields.push(t('serviceCategory'));
    if (financingTypes.length === 0) missingFields.push(t('financingType'));
    if (!desiredStartTime) missingFields.push(t('startTime'));
    if (!desiredEndTime) missingFields.push(t('endTime'));
    if (!acceptedTerms) missingFields.push(t('terms'));

    // If there are missing fields, show a detailed error message
    if (missingFields.length > 0) {
      const fieldsList = missingFields.map((field, index) => `${index + 1}. ${field}`).join('\n');
      Alert.alert(
        t('missingFieldsTitle'),
        `${t('missingFieldsMessage')}\n\n${fieldsList}`
      );
      console.log('[Registration] Missing required fields:', missingFields);
      return;
    }

    try {
      const { apiPost, apiGet, isBackendConfigured, BACKEND_URL } = await import('@/utils/api');
      
      // Check if backend is configured
      if (!isBackendConfigured()) {
        console.error('[Registration] Backend URL not configured');
        Alert.alert(
          'Configuration Error',
          'The app backend is not configured. Please contact support.\n\nBackend URL: ' + (BACKEND_URL || 'NOT SET')
        );
        return;
      }
      
      console.log('[Registration] Backend URL:', BACKEND_URL);
      
      // Test backend connectivity first
      try {
        console.log('[Registration] Testing backend connectivity...');
        await apiGet('/health');
        console.log('[Registration] Backend is reachable');
      } catch (healthError: any) {
        console.error('[Registration] Backend health check failed:', healthError);
        Alert.alert(
          'Backend Unavailable',
          'Cannot connect to the backend server. Please ensure:\n\n' +
          '1. The backend is running\n' +
          '2. Your internet connection is working\n' +
          '3. The backend URL is correct\n\n' +
          'Backend URL: ' + BACKEND_URL + '\n\n' +
          'Error: ' + healthError.message
        );
        return;
      }
      
      const registrationData = {
        email: userEmail || '',
        firstName,
        lastName,
        state,
        town,
        zipCode,
        serviceCategories,
        financingType: financingTypes,
        servicePeriodStart: servicePeriodStart?.toISOString(),
        servicePeriodEnd: servicePeriodEnd?.toISOString(),
        preferredLanguages,
        desiredDays,
        desiredStartTime: desiredStartTime?.toISOString(),
        desiredEndTime: desiredEndTime?.toISOString(),
        acceptedTerms,
      };
      
      console.log('[Registration] Sending parent registration data to:', BACKEND_URL + '/auth/register-parent');
      console.log('[Registration] Registration data:', JSON.stringify(registrationData, null, 2));
      
      // Call backend API to register parent
      const response = await apiPost('/auth/register-parent', registrationData);
      console.log('[Registration] Parent registered successfully:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to register parent');
      }
      
      // Create profile object with response data
      const profile: ParentProfile = {
        id: response.userId,
        userType: 'parent',
        email: userEmail || '',
        firstName,
        lastName,
        state,
        town,
        zipCode,
        serviceCategories,
        financingType: financingTypes,
        servicePeriodStart,
        servicePeriodEnd,
        preferredLanguages,
        desiredDays,
        desiredStartTime,
        desiredEndTime,
        acceptedTerms,
        subscriptionActive: false,
      };
      
      setUserProfile(profile);
      
      // Save user ID and type to storage for session restoration
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('doula_connect_user_id', response.userId);
      await AsyncStorage.setItem('doula_connect_user_type', 'parent');
      console.log('[Registration] User session saved to storage');
      
      console.log('[Registration] Navigating to payment screen...');
      router.push('/payment');
      console.log('[Registration] Navigation command sent');
    } catch (error: any) {
      console.error('[Registration] Error creating parent profile:', error);
      console.error('[Registration] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let errorMessage = error.message || 'Failed to create profile. Please try again.';
      
      // Check if it's a navigation error
      if (error.message && error.message.toLowerCase().includes('not found')) {
        errorMessage = 'Navigation error: Payment screen not found. Please contact support.';
        console.error('[Registration] NAVIGATION ERROR - Payment route not found');
      }
      
      Alert.alert('Error', errorMessage);
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
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>{t('serviceReq')}</Text>
          
          <Text style={commonStyles.label}>{t('serviceCategory')} *</Text>
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

          <Text style={[commonStyles.label, { marginTop: 16 }]}>{t('financingType')} *</Text>
          <CheckboxItem
            label={t('selfPay')}
            checked={financingTypes.includes('self')}
            onPress={() => toggleFinancingType('self')}
          />
          <CheckboxItem
            label={t('carrot')}
            checked={financingTypes.includes('carrot')}
            onPress={() => toggleFinancingType('carrot')}
          />
          <CheckboxItem
            label={t('medicaid')}
            checked={financingTypes.includes('medicaid')}
            onPress={() => toggleFinancingType('medicaid')}
          />
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>{t('servicePeriod')}</Text>
          
          <Text style={commonStyles.label}>{t('startDate')}</Text>
          <TouchableOpacity
            style={commonStyles.input}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={{ color: servicePeriodStart ? colors.text : colors.textSecondary }}>
              {servicePeriodStart ? servicePeriodStart.toLocaleDateString() : t('startDate')}
            </Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={servicePeriodStart || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  console.log('Start date selected:', selectedDate);
                  setServicePeriodStart(selectedDate);
                }
              }}
            />
          )}

          <Text style={commonStyles.label}>{t('endDate')}</Text>
          <TouchableOpacity
            style={commonStyles.input}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={{ color: servicePeriodEnd ? colors.text : colors.textSecondary }}>
              {servicePeriodEnd ? servicePeriodEnd.toLocaleDateString() : t('endDate')}
            </Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={servicePeriodEnd || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  console.log('End date selected:', selectedDate);
                  setServicePeriodEnd(selectedDate);
                }
              }}
            />
          )}
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>{t('preferences')}</Text>
          
          <Text style={commonStyles.label}>{t('preferredLang')}</Text>
          {(['English', 'Spanish', 'Chinese', 'Tagalog', 'Arabic', 'Hebrew', 'Vietnamese'] as SpokenLanguage[]).map((lang) => (
            <CheckboxItem
              key={lang}
              label={lang}
              checked={preferredLanguages.includes(lang)}
              onPress={() => toggleLanguage(lang)}
            />
          ))}

          <Text style={[commonStyles.label, { marginTop: 16 }]}>{t('desiredDays')}</Text>
          {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as DayOfWeek[]).map((day) => (
            <CheckboxItem
              key={day}
              label={day}
              checked={desiredDays.includes(day)}
              onPress={() => toggleDay(day)}
            />
          ))}

          <Text style={[commonStyles.label, { marginTop: 16 }]}>{t('desiredHours')}</Text>
          <Text style={commonStyles.label}>{t('startTime')} *</Text>
          <TouchableOpacity
            style={commonStyles.input}
            onPress={() => setShowStartTimePicker(true)}
          >
            <Text style={{ color: desiredStartTime ? colors.text : colors.textSecondary }}>
              {desiredStartTime ? desiredStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('startTime')}
            </Text>
          </TouchableOpacity>
          {showStartTimePicker && (
            <DateTimePicker
              value={desiredStartTime || new Date()}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowStartTimePicker(Platform.OS === 'ios');
                if (selectedTime) {
                  console.log('Start time selected:', selectedTime);
                  setDesiredStartTime(selectedTime);
                }
              }}
            />
          )}

          <Text style={commonStyles.label}>{t('endTime')} *</Text>
          <TouchableOpacity
            style={commonStyles.input}
            onPress={() => setShowEndTimePicker(true)}
          >
            <Text style={{ color: desiredEndTime ? colors.text : colors.textSecondary }}>
              {desiredEndTime ? desiredEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('endTime')}
            </Text>
          </TouchableOpacity>
          {showEndTimePicker && (
            <DateTimePicker
              value={desiredEndTime || new Date()}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowEndTimePicker(Platform.OS === 'ios');
                if (selectedTime) {
                  console.log('End time selected:', selectedTime);
                  setDesiredEndTime(selectedTime);
                }
              }}
            />
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
});
