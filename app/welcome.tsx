
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { Language, UserType } from '@/types';
import { useUser } from '@/contexts/UserContext';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { colors } from '@/styles/commonStyles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.primary,
    minWidth: 120,
  },
  buttonSelected: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  buttonTextSelected: {
    color: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginTop: 20,
  },
  continueButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default function WelcomeScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null);
  const { setLanguage, setUserType } = useUser();
  const router = useRouter();

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
  };

  const handleUserTypeSelect = (userType: UserType) => {
    setSelectedUserType(userType);
  };

  const handleContinue = () => {
    if (selectedLanguage && selectedUserType) {
      setLanguage(selectedLanguage);
      setUserType(selectedUserType);
      
      if (selectedUserType === 'parent') {
        router.push('/registration/parent');
      } else {
        router.push('/registration/doula');
      }
    }
  };

  const t = (key: string) => {
    const translations: Record<string, Record<Language, string>> = {
      welcome: { en: 'Welcome to Doula CONNECT', es: 'Bienvenido a Doula CONNECT' },
      subtitle: { 
        en: 'Connecting new parents with certified doulas', 
        es: 'Conectando nuevos padres con doulas certificadas' 
      },
      selectLanguage: { en: 'Select Language', es: 'Seleccionar idioma' },
      selectUserType: { en: 'I am a...', es: 'Soy un...' },
      english: { en: 'English', es: 'Inglés' },
      spanish: { en: 'Spanish', es: 'Español' },
      parent: { en: 'New Parent', es: 'Nuevo Padre' },
      doula: { en: 'Doula', es: 'Doula' },
      continue: { en: 'Continue', es: 'Continuar' },
    };

    return translations[key]?.[selectedLanguage || 'en'] || key;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image 
          source={require('@/assets/images/68efd62c-bf18-4501-be6c-954ddc8107fb.png')}
          style={styles.logo}
        />
        
        <Text style={styles.title}>{t('welcome')}</Text>
        <Text style={styles.subtitle}>{t('subtitle')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('selectLanguage')}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.button,
                selectedLanguage === 'en' && styles.buttonSelected,
              ]}
              onPress={() => handleLanguageSelect('en')}
            >
              <Text
                style={[
                  styles.buttonText,
                  selectedLanguage === 'en' && styles.buttonTextSelected,
                ]}
              >
                {t('english')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                selectedLanguage === 'es' && styles.buttonSelected,
              ]}
              onPress={() => handleLanguageSelect('es')}
            >
              <Text
                style={[
                  styles.buttonText,
                  selectedLanguage === 'es' && styles.buttonTextSelected,
                ]}
              >
                {t('spanish')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('selectUserType')}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.button,
                selectedUserType === 'parent' && styles.buttonSelected,
              ]}
              onPress={() => handleUserTypeSelect('parent')}
            >
              <Text
                style={[
                  styles.buttonText,
                  selectedUserType === 'parent' && styles.buttonTextSelected,
                ]}
              >
                {t('parent')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                selectedUserType === 'doula' && styles.buttonSelected,
              ]}
              onPress={() => handleUserTypeSelect('doula')}
            >
              <Text
                style={[
                  styles.buttonText,
                  selectedUserType === 'doula' && styles.buttonTextSelected,
                ]}
              >
                {t('doula')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
