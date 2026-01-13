
import React, { useState } from 'react';
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
  ActivityIndicator,
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  inputSuccess: {
    borderColor: '#34C759',
    borderWidth: 2,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: -10,
    marginBottom: 20,
  },
  successText: {
    fontSize: 14,
    color: '#34C759',
    marginTop: -10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 20,
  },
  matchText: {
    fontSize: 14,
    marginLeft: 8,
  },
});

export default function EmailAuthScreen() {
  const { language, userType, setUserEmail, setIsEmailVerified } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [confirmEmailTouched, setConfirmEmailTouched] = useState(false);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      emailAuth: { en: 'Email Verification', es: 'Verificación de correo' },
      enterEmail: { en: 'Enter your email address to continue with registration', es: 'Ingrese su dirección de correo para continuar con el registro' },
      emailLabel: { en: 'Email Address', es: 'Dirección de correo' },
      confirmEmailLabel: { en: 'Confirm Email Address', es: 'Confirmar dirección de correo' },
      emailPlaceholder: { en: 'your@email.com', es: 'tu@correo.com' },
      confirmEmailPlaceholder: { en: 'Re-enter your email', es: 'Vuelva a ingresar su correo' },
      continue: { en: 'Continue to Registration', es: 'Continuar al registro' },
      invalidEmail: { en: 'Please enter a valid email address', es: 'Por favor ingrese un correo válido' },
      emailsDoNotMatch: { en: 'Email addresses do not match', es: 'Las direcciones de correo no coinciden' },
      emailsMatch: { en: 'Email addresses match', es: 'Las direcciones de correo coinciden' },
      fillBothFields: { en: 'Please fill in both email fields', es: 'Por favor complete ambos campos de correo' },
      infoText: { en: 'Please enter your email address twice to confirm it is correct before proceeding to registration.', es: 'Por favor ingrese su dirección de correo dos veces para confirmar que es correcta antes de continuar con el registro.' },
    };
    return translations[key]?.[language] || key;
  };

  const validateEmail = (emailText: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailText);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setError('');
    if (!emailTouched) {
      setEmailTouched(true);
    }
  };

  const handleConfirmEmailChange = (text: string) => {
    setConfirmEmail(text);
    setError('');
    if (!confirmEmailTouched) {
      setConfirmEmailTouched(true);
    }
  };

  const getEmailInputStyle = () => {
    if (!emailTouched || !email) {
      return styles.input;
    }
    if (!validateEmail(email)) {
      return [styles.input, styles.inputError];
    }
    return [styles.input, styles.inputSuccess];
  };

  const getConfirmEmailInputStyle = () => {
    if (!confirmEmailTouched || !confirmEmail) {
      return styles.input;
    }
    if (!validateEmail(confirmEmail)) {
      return [styles.input, styles.inputError];
    }
    if (email !== confirmEmail) {
      return [styles.input, styles.inputError];
    }
    return [styles.input, styles.inputSuccess];
  };

  const showMatchIndicator = () => {
    if (!confirmEmailTouched || !confirmEmail || !email) {
      return null;
    }

    const emailsMatch = email === confirmEmail && validateEmail(email) && validateEmail(confirmEmail);

    if (emailsMatch) {
      return (
        <View style={styles.matchIndicator}>
          <IconSymbol
            ios_icon_name="checkmark.circle.fill"
            android_material_icon_name="check-circle"
            size={20}
            color="#34C759"
          />
          <Text style={[styles.matchText, { color: '#34C759' }]}>
            {t('emailsMatch')}
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.matchIndicator}>
          <IconSymbol
            ios_icon_name="xmark.circle.fill"
            android_material_icon_name="cancel"
            size={20}
            color="#FF3B30"
          />
          <Text style={[styles.matchText, { color: '#FF3B30' }]}>
            {t('emailsDoNotMatch')}
          </Text>
        </View>
      );
    }
  };

  const handleContinue = async () => {
    console.log('[Email Verification] Validating email confirmation');
    
    // Clear previous errors
    setError('');

    // Validate both fields are filled
    if (!email || !confirmEmail) {
      setError(t('fillBothFields'));
      Alert.alert('Error', t('fillBothFields'));
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setError(t('invalidEmail'));
      Alert.alert('Error', t('invalidEmail'));
      return;
    }

    // Validate emails match
    if (email !== confirmEmail) {
      setError(t('emailsDoNotMatch'));
      Alert.alert('Error', t('emailsDoNotMatch'));
      return;
    }

    setLoading(true);
    
    try {
      console.log('[Email Verification] Email confirmed:', email);
      
      // Set email as verified in context
      setUserEmail(email);
      setIsEmailVerified(true);
      
      // Navigate to appropriate registration screen
      if (userType === 'parent') {
        console.log('[Email Verification] Navigating to parent registration');
        router.push('/registration/parent');
      } else {
        console.log('[Email Verification] Navigating to doula registration');
        router.push('/registration/doula');
      }
    } catch (error: any) {
      console.error('[Email Verification] Error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      email &&
      confirmEmail &&
      validateEmail(email) &&
      validateEmail(confirmEmail) &&
      email === confirmEmail
    );
  };

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
          editable={!loading}
          onBlur={() => setEmailTouched(true)}
        />

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
          editable={!loading}
          onBlur={() => setConfirmEmailTouched(true)}
        />

        {showMatchIndicator()}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, (!isFormValid() || loading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!isFormValid() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>{t('continue')}</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.infoText}>
          {t('infoText')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
