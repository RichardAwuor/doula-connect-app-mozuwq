
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
import {
  ServiceCategory,
  FinancingType,
  SpokenLanguage,
  DayOfWeek,
  ParentProfile,
} from '@/types';

export default function ParentRegistrationScreen() {
  const router = useRouter();
  const { setUserProfile } = useUser();

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

  const toggleLanguage = (language: SpokenLanguage) => {
    console.log('Toggle language:', language);
    setPreferredLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language]
    );
  };

  const toggleDay = (day: DayOfWeek) => {
    console.log('Toggle day:', day);
    setDesiredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = () => {
    console.log('Submitting parent registration');
    
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

    const profile: ParentProfile = {
      id: Date.now().toString(),
      userType: 'parent',
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

    console.log('Parent profile created:', profile);
    setUserProfile(profile);
    router.push('/payment');
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={commonStyles.title}>New Parent Registration</Text>
        <Text style={styles.subtitle}>
          Complete your profile to connect with certified doulas
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
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Service Requirements</Text>
          
          <Text style={commonStyles.label}>Service Category *</Text>
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

          <Text style={[commonStyles.label, { marginTop: 16 }]}>Financing Type *</Text>
          <CheckboxItem
            label="Self/Out-Of-Pocket"
            checked={financingTypes.includes('self')}
            onPress={() => toggleFinancingType('self')}
          />
          <CheckboxItem
            label="CARROT Fertility"
            checked={financingTypes.includes('carrot')}
            onPress={() => toggleFinancingType('carrot')}
          />
          <CheckboxItem
            label="Medicaid/MediCal"
            checked={financingTypes.includes('medicaid')}
            onPress={() => toggleFinancingType('medicaid')}
          />
        </View>

        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Service Period</Text>
          
          <Text style={commonStyles.label}>Start Date</Text>
          <TouchableOpacity
            style={commonStyles.input}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={{ color: servicePeriodStart ? colors.text : colors.textSecondary }}>
              {servicePeriodStart ? servicePeriodStart.toLocaleDateString() : 'Select start date'}
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

          <Text style={commonStyles.label}>End Date</Text>
          <TouchableOpacity
            style={commonStyles.input}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={{ color: servicePeriodEnd ? colors.text : colors.textSecondary }}>
              {servicePeriodEnd ? servicePeriodEnd.toLocaleDateString() : 'Select end date'}
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
          <Text style={commonStyles.subtitle}>Preferences</Text>
          
          <Text style={commonStyles.label}>Preferred Languages</Text>
          {(['English', 'Spanish', 'Chinese', 'Tagalog', 'Arabic', 'Hebrew', 'Vietnamese'] as SpokenLanguage[]).map((lang) => (
            <CheckboxItem
              key={lang}
              label={lang}
              checked={preferredLanguages.includes(lang)}
              onPress={() => toggleLanguage(lang)}
            />
          ))}

          <Text style={[commonStyles.label, { marginTop: 16 }]}>Desired Service Days</Text>
          {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as DayOfWeek[]).map((day) => (
            <CheckboxItem
              key={day}
              label={day}
              checked={desiredDays.includes(day)}
              onPress={() => toggleDay(day)}
            />
          ))}

          <Text style={[commonStyles.label, { marginTop: 16 }]}>Desired Service Hours</Text>
          <Text style={commonStyles.label}>Start Time</Text>
          <TouchableOpacity
            style={commonStyles.input}
            onPress={() => setShowStartTimePicker(true)}
          >
            <Text style={{ color: desiredStartTime ? colors.text : colors.textSecondary }}>
              {desiredStartTime ? desiredStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select start time'}
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

          <Text style={commonStyles.label}>End Time</Text>
          <TouchableOpacity
            style={commonStyles.input}
            onPress={() => setShowEndTimePicker(true)}
          >
            <Text style={{ color: desiredEndTime ? colors.text : colors.textSecondary }}>
              {desiredEndTime ? desiredEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select end time'}
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
});
