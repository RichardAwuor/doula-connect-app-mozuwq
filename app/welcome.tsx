
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { colors, commonStyles } from '@/styles/commonStyles';
import { Language, UserType } from '@/types';

export default function WelcomeScreen() {
  const router = useRouter();
  const { selectedLanguage, setSelectedLanguage, setSelectedUserType } = useUser();

  const handleLanguageSelect = (language: Language) => {
    console.log('Language selected:', language);
    setSelectedLanguage(language);
  };

  const handleUserTypeSelect = (userType: UserType) => {
    console.log('User type selected:', userType);
    setSelectedUserType(userType);
    
    if (userType === 'parent') {
      router.push('/registration/parent');
    } else {
      router.push('/registration/doula');
    }
  };

  const t = (key: string) => {
    const translations: Record<string, Record<Language, string>> = {
      welcome: { english: 'Welcome to', spanish: 'Bienvenido a' },
      subtitle: {
        english: 'Connecting new parents with certified doulas',
        spanish: 'Conectando nuevos padres con doulas certificadas',
      },
      selectLanguage: {
        english: 'Select Your Language',
        spanish: 'Selecciona tu idioma',
      },
      selectUserType: {
        english: 'I am a...',
        spanish: 'Soy un...',
      },
      newParent: {
        english: 'New Parent',
        spanish: 'Nuevo Padre',
      },
      doula: {
        english: 'Doula',
        spanish: 'Doula',
      },
    };
    return translations[key]?.[selectedLanguage] || key;
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://prod-finalquest-user-projects-storage-bucket-aws.s3.amazonaws.com/user-projects/3657acf7-31f1-49b8-b102-88845426429d/assets/images/fd2e996e-be1f-45aa-8204-b7d5764d5e93.png?AWSAccessKeyId=AKIAVRUVRKQJC5DISQ4Q&Signature=R1FBlEbrMcusxaJ%2B%2F%2FyEjWzNZ78%3D&Expires=1768028291' }}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{t('welcome')}</Text>
          <Text style={styles.brandName}>Doula CONNECT</Text>
          <Text style={styles.subtitle}>{t('subtitle')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('selectLanguage')}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                selectedLanguage === 'english' && styles.languageButtonActive,
              ]}
              onPress={() => handleLanguageSelect('english')}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  selectedLanguage === 'english' && styles.languageButtonTextActive,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                selectedLanguage === 'spanish' && styles.languageButtonActive,
              ]}
              onPress={() => handleLanguageSelect('spanish')}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  selectedLanguage === 'spanish' && styles.languageButtonTextActive,
                ]}
              >
                Español
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('selectUserType')}</Text>
          <TouchableOpacity
            style={commonStyles.button}
            onPress={() => handleUserTypeSelect('parent')}
          >
            <Text style={commonStyles.buttonText}>{t('newParent')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={commonStyles.secondaryButton}
            onPress={() => handleUserTypeSelect('doula')}
          >
            <Text style={commonStyles.secondaryButtonText}>{t('doula')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingTop: 48,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  brandName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  languageButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  languageButtonTextActive: {
    color: colors.primary,
  },
});
