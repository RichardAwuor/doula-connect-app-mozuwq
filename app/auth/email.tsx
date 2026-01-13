
import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 30,
    lineHeight: 22,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: colors.text,
    marginBottom: 10,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  inputSuccess: {
    borderColor: '#34C759',
  },
  inputNeutral: {
    borderColor: colors.border,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  validationText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  errorText: {
    color: '#FF3B30',
  },
  successText: {
    color: '#34C759',
  },
  neutralText: {
    color: colors.textSecondary,
  },
  infoBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  successBox: {
    backgroundColor: '#34C75920',
    borderColor: '#34C759',
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    marginTop: 30,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
    marginTop: 10,
    marginBottom: 5,
  },
  successMessage: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
});

export default function EmailAuthScreen() {
  const { language, userType, setUserEmail, setIsEmailVerified } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [confirmEmailTouched, setConfirmEmailTouched] = useState(false);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      emailAuth: { en: 'Email Confirmation', es: 'Confirmación de correo' },
      enterEmail: { 
        en: 'Please enter and confirm your email address to continue', 
        es: 'Por favor ingrese y confirme su dirección de correo para continuar' 
      },
      emailLabel: { en: 'Email Address', es: 'Dirección de correo' },
      confirmEmailLabel: { en: 'Confirm Email Address', es: 'Confirmar dirección de correo' },
      emailPlaceholder: { en: 'your@email.com', es: 'tu@correo.com' },
      confirmEmailPlaceholder: { en: 'Confirm your email', es: 'Confirme su correo' },
      invalidEmail: { en: 'Please enter a valid email address', es: 'Por favor ingrese un correo válido' },
      emailsMatch: { en: 'Email addresses match!', es: '¡Las direcciones de correo coinciden!' },
      emailsDontMatch: { en: 'Email addresses do not match', es: 'Las direcciones de correo no coinciden' },
      enterBothEmails: { en: 'Please enter both email fields', es: 'Por favor ingrese ambos campos de correo' },
      validEmail: { en: 'Valid email format', es: 'Formato de correo válido' },
      infoText: { 
        en: 'Your email will be used to identify your account. Please make sure it is correct.', 
        es: 'Su correo se utilizará para identificar su cuenta. Por favor asegúrese de que sea correcto.' 
      },
      proceedingToRegistration: {
        en: 'Proceeding to registration...',
        es: 'Procediendo al registro...'
      },
      emailConfirmed: {
        en: 'Email Confirmed!',
        es: '¡Correo confirmado!'
      },
    };
    return translations[key]?.[language] || key;
  };

  const validateEmail = (emailText: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailText);
  };

  const handleEmailChange = (text: string) => {
    console.log('[Email Auth] Email changed:', text);
    setEmail(text.trim().toLowerCase());
    if (!emailTouched) {
      setEmailTouched(true);
    }
  };

  const handleConfirmEmailChange = (text: string) => {
    console.log('[Email Auth] Confirm email changed:', text);
    setConfirmEmail(text.trim().toLowerCase());
    if (!confirmEmailTouched) {
      setConfirmEmailTouched(true);
    }
  };

  const getEmailInputStyle = () => {
    if (!emailTouched || !email) {
      return [styles.input, styles.inputNeutral];
    }
    if (!validateEmail(email)) {
      return [styles.input, styles.inputError];
    }
    return [styles.input, styles.inputSuccess];
  };

  const getConfirmEmailInputStyle = () => {
    if (!confirmEmailTouched || !confirmEmail) {
      return [styles.input, styles.inputNeutral];
    }
    if (!validateEmail(confirmEmail)) {
      return [styles.input, styles.inputError];
    }
    if (email !== confirmEmail) {
      return [styles.input, styles.inputError];
    }
    return [styles.input, styles.inputSuccess];
  };

  const emailValid = validateEmail(email);
  const confirmEmailValid = validateEmail(confirmEmail);
  const emailsMatch = email === confirmEmail && emailValid && confirmEmailValid && email.length > 0;

  // Auto-navigate when emails match
  useEffect(() => {
    if (emailsMatch) {
      console.log('[Email Auth] Emails match! Email:', email);
      console.log('[Email Auth] User type:', userType);
      
      // Set email as verified in context
      setUserEmail(email);
      setIsEmailVerified(true);

      // Show success message briefly before navigating
      const timer = setTimeout(() => {
        // Navigate to appropriate registration screen
        if (userType === 'parent') {
          console.log('[Email Auth] Navigating to parent registration');
          router.push('/registration/parent');
        } else {
          console.log('[Email Auth] Navigating to doula registration');
          router.push('/registration/doula');
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [emailsMatch, email, userType, router, setUserEmail, setIsEmailVerified]);

  return (
    <SafeAreaView style={styles.container}>
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

        <Text style={styles.title}>{t('emailAuth')}</Text>
        <Text style={styles.subtitle}>{t('enterEmail')}</Text>

        {/* Email Input */}
        <Text style={styles.label}>{t('emailLabel')} *</Text>
        <TextInput
          style={getEmailInputStyle()}
          placeholder={t('emailPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={handleEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onBlur={() => setEmailTouched(true)}
        />

        {/* Email Validation Feedback */}
        {emailTouched && email && (
          <View style={styles.validationRow}>
            <IconSymbol
              ios_icon_name={emailValid ? "checkmark.circle.fill" : "xmark.circle.fill"}
              android_material_icon_name={emailValid ? "check-circle" : "cancel"}
              size={20}
              color={emailValid ? '#34C759' : '#FF3B30'}
            />
            <Text style={[
              styles.validationText,
              emailValid ? styles.successText : styles.errorText
            ]}>
              {emailValid ? t('validEmail') : t('invalidEmail')}
            </Text>
          </View>
        )}

        {/* Confirm Email Input */}
        <Text style={styles.label}>{t('confirmEmailLabel')} *</Text>
        <TextInput
          style={getConfirmEmailInputStyle()}
          placeholder={t('confirmEmailPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={confirmEmail}
          onChangeText={handleConfirmEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onBlur={() => setConfirmEmailTouched(true)}
        />

        {/* Confirm Email Validation Feedback */}
        {confirmEmailTouched && confirmEmail && (
          <View style={styles.validationRow}>
            <IconSymbol
              ios_icon_name={emailsMatch ? "checkmark.circle.fill" : "xmark.circle.fill"}
              android_material_icon_name={emailsMatch ? "check-circle" : "cancel"}
              size={20}
              color={emailsMatch ? '#34C759' : '#FF3B30'}
            />
            <Text style={[
              styles.validationText,
              emailsMatch ? styles.successText : styles.errorText
            ]}>
              {!confirmEmailValid 
                ? t('invalidEmail')
                : emailsMatch 
                  ? t('emailsMatch') 
                  : t('emailsDontMatch')
              }
            </Text>
          </View>
        )}

        {/* Success Box - shown when emails match */}
        {emailsMatch && (
          <View style={styles.successBox}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={48}
              color="#34C759"
            />
            <Text style={styles.successTitle}>{t('emailConfirmed')}</Text>
            <Text style={styles.successMessage}>{t('proceedingToRegistration')}</Text>
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{t('infoText')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
