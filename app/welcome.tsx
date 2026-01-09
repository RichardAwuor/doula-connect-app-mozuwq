
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { Language, UserType } from '@/types';
import { useUser } from '@/contexts/UserContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { setLanguage, setUserType } = useUser();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null);

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    setLanguage(language);
  };

  const handleUserTypeSelect = (userType: UserType) => {
    setSelectedUserType(userType);
    setUserType(userType);
  };

  const handleContinue = () => {
    if (selectedLanguage && selectedUserType) {
      router.push(selectedUserType === 'parent' ? '/registration/parent' : '/registration/doula');
    }
  };

  const t = (key: string) => {
    const translations: Record<string, Record<Language, string>> = {
      selectLanguage: { en: 'Select Language', es: 'Seleccionar Idioma' },
      english: { en: 'English', es: 'Inglés' },
      spanish: { en: 'Spanish', es: 'Español' },
      iAmA: { en: 'I am a...', es: 'Soy un...' },
      newParent: { en: 'New Parent', es: 'Nuevo Padre' },
      doula: { en: 'Doula', es: 'Doula' },
      continue: { en: 'Continue', es: 'Continuar' },
    };
    return translations[key]?.[selectedLanguage || 'en'] || key;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoTextDoula}>DOULA</Text>
            <Text style={styles.logoTextConnect}>CONNECT</Text>
          </View>
          <Text style={styles.tagline}>Connecting Care, Supporting Families</Text>
        </View>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('selectLanguage')}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedLanguage === 'en' && styles.optionButtonSelected,
              ]}
              onPress={() => handleLanguageSelect('en')}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedLanguage === 'en' && styles.optionTextSelected,
                ]}
              >
                {t('english')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedLanguage === 'es' && styles.optionButtonSelected,
              ]}
              onPress={() => handleLanguageSelect('es')}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedLanguage === 'es' && styles.optionTextSelected,
                ]}
              >
                {t('spanish')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* User Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('iAmA')}</Text>
          <TouchableOpacity
            style={[
              styles.userTypeButton,
              selectedUserType === 'parent' && styles.userTypeButtonSelected,
            ]}
            onPress={() => handleUserTypeSelect('parent')}
          >
            <Text
              style={[
                styles.userTypeText,
                selectedUserType === 'parent' && styles.userTypeTextSelected,
              ]}
            >
              {t('newParent')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.userTypeButton,
              selectedUserType === 'doula' && styles.userTypeButtonSelected,
            ]}
            onPress={() => handleUserTypeSelect('doula')}
          >
            <Text
              style={[
                styles.userTypeText,
                selectedUserType === 'doula' && styles.userTypeTextSelected,
              ]}
            >
              {t('doula')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!selectedLanguage || !selectedUserType) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedLanguage || !selectedUserType}
        >
          <Text style={styles.continueButtonText}>{t('continue')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.beige,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
    marginTop: 20,
  },
  logoCircle: {
    width: 220,
    height: 220,
    backgroundColor: colors.pink,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 5,
    borderColor: colors.black,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoTextDoula: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.black,
    letterSpacing: 3,
    marginBottom: 4,
  },
  logoTextConnect: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.black,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 17,
    color: colors.black,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 18,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  optionButton: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: colors.black,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  optionButtonSelected: {
    backgroundColor: colors.pink,
    borderWidth: 4,
  },
  optionText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.black,
    textAlign: 'center',
  },
  optionTextSelected: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  userTypeButton: {
    backgroundColor: colors.white,
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: colors.black,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  userTypeButtonSelected: {
    backgroundColor: colors.pink,
    borderWidth: 4,
  },
  userTypeText: {
    fontSize: 19,
    fontWeight: '600',
    color: colors.black,
    textAlign: 'center',
  },
  userTypeTextSelected: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  continueButton: {
    backgroundColor: colors.black,
    paddingVertical: 20,
    borderRadius: 14,
    marginTop: 32,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    fontSize: 19,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
