
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
    
    if (!firstName || !lastName || !state || !town || !zipCode) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (serviceCategories.length === 0) {
      Alert.alert('Error', 'Please select at least one service category');
      return;
    }

    if (financingTypes.length === 0) {
      Alert.alert('Error', 'Please select at least one financing type');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Error', 'Please accept the terms and conditions');
      return;
    }

    try {
      // TODO: Backend Integration - User Registration Endpoint
      // The backend needs to implement: POST /api/users/parent
      // Request body should include all registration data
      // Response should return: { success: boolean, userId: string, profile: ParentProfile }
      
      const { apiPost } = await import('@/utils/api');
      
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
      
      console.log('[Registration] Sending registration data:', registrationData);
      
      // Call backend API to create parent profile
      const response = await apiPost('/api/users/parent', registrationData);
      console.log('[Registration] Profile created:', response);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create profile');
      }
      
      // Create profile object with response data
      const profile: ParentProfile = {
        id: response.userId || `parent_${Date.now()}`, // Fallback ID if backend doesn't return one
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
      router.push('/payment');
    } catch (error: any) {
      console.error('[Registration] Error creating profile:', error);
      
      // Check if this is a "endpoint not found" error
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        Alert.alert(
          'Backend Not Ready',
          'The user registration endpoint is not yet implemented on the backend. Please implement POST /api/users/parent endpoint.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to create profile. Please try again.');
      }
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
          <Text style={commonStyles.label}>{t('startTime')}</Text>
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

          <Text style={commonStyles.label}>{t('endTime')}</Text>
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
