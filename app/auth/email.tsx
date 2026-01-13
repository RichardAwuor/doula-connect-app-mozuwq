
import React, { useState, useRef } from 'react';
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    width: 50,
    height: 60,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: colors.primary,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resendButton: {
    marginLeft: 5,
  },
  resendButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  resendButtonDisabled: {
    color: colors.textSecondary,
  },
});

export default function EmailAuthScreen() {
  const { language, userType, setUserEmail, setIsEmailVerified } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const otpInputRefs = useRef<Array<TextInput | null>>([]);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      emailAuth: { en: 'Email Verification', es: 'Verificación de correo' },
      enterEmail: { en: 'Enter your email address to receive a verification code', es: 'Ingrese su dirección de correo para recibir un código de verificación' },
      emailLabel: { en: 'Email Address', es: 'Dirección de correo' },
      emailPlaceholder: { en: 'your@email.com', es: 'tu@correo.com' },
      sendCode: { en: 'Send Verification Code', es: 'Enviar código de verificación' },
      invalidEmail: { en: 'Please enter a valid email address', es: 'Por favor ingrese un correo válido' },
      otpSent: { en: 'Verification code sent! Check your email.', es: 'Código de verificación enviado! Revise su correo.' },
      enterOtp: { en: 'Enter the 6-digit code sent to your email', es: 'Ingrese el código de 6 dígitos enviado a su correo' },
      otpLabel: { en: 'Verification Code', es: 'Código de verificación' },
      verify: { en: 'Verify & Continue', es: 'Verificar y continuar' },
      resend: { en: 'Resend Code', es: 'Reenviar código' },
      resendIn: { en: 'Resend in', es: 'Reenviar en' },
      seconds: { en: 'seconds', es: 'segundos' },
      invalidOtp: { en: 'Invalid verification code', es: 'Código de verificación inválido' },
      otpExpired: { en: 'Verification code expired. Please request a new one.', es: 'Código de verificación expirado. Por favor solicite uno nuevo.' },
      infoText: { en: 'We will send a 6-digit verification code to your email address.', es: 'Enviaremos un código de verificación de 6 dígitos a su dirección de correo.' },
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

  const getEmailInputStyle = () => {
    if (!emailTouched || !email) {
      return styles.input;
    }
    if (!validateEmail(email)) {
      return [styles.input, styles.inputError];
    }
    return [styles.input, styles.inputSuccess];
  };

  const handleSendOTP = async () => {
    console.log('[Email Auth] Sending OTP to:', email);
    
    setError('');

    if (!validateEmail(email)) {
      setError(t('invalidEmail'));
      Alert.alert('Error', t('invalidEmail'));
      return;
    }

    setLoading(true);
    
    try {
      const { apiPost } = await import('@/utils/api');
      const response = await apiPost('/auth/send-otp', { email });
      
      console.log('[Email Auth] OTP sent:', response);
      
      if (response.success) {
        setOtpSent(true);
        setExpiresIn(response.expiresIn || 300);
        setResendCountdown(60); // 60 seconds before allowing resend
        
        // Start countdown timer
        const interval = setInterval(() => {
          setResendCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        Alert.alert('Success', t('otpSent'));
      } else {
        throw new Error(response.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('[Email Auth] Error sending OTP:', error);
      Alert.alert('Error', error.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newOtp.every((digit) => digit !== '') && value) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    // Handle backspace
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    console.log('[Email Auth] Verifying OTP:', code);
    setLoading(true);
    
    try {
      const { apiPost } = await import('@/utils/api');
      const response = await apiPost('/auth/verify-otp', { 
        email, 
        code 
      });
      
      console.log('[Email Auth] OTP verified:', response);
      
      if (response.success) {
        // Set email as verified in context
        setUserEmail(email);
        setIsEmailVerified(true);
        
        // Navigate to appropriate registration screen
        if (userType === 'parent') {
          console.log('[Email Auth] Navigating to parent registration');
          router.push('/registration/parent');
        } else {
          console.log('[Email Auth] Navigating to doula registration');
          router.push('/registration/doula');
        }
      } else {
        throw new Error(response.error || 'Invalid verification code');
      }
    } catch (error: any) {
      console.error('[Email Auth] Error verifying OTP:', error);
      
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
      
      if (error.message?.includes('expired')) {
        setError(t('otpExpired'));
        Alert.alert('Error', t('otpExpired'));
      } else {
        setError(t('invalidOtp'));
        Alert.alert('Error', error.message || t('invalidOtp'));
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    if (!otpSent) {
      return email && validateEmail(email);
    }
    return otp.every((digit) => digit !== '');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (otpSent) {
                setOtpSent(false);
                setOtp(['', '', '', '', '', '']);
                setError('');
              } else {
                router.back();
              }
            }}
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
        <Text style={styles.subtitle}>
          {otpSent ? t('enterOtp') : t('enterEmail')}
        </Text>

        {!otpSent ? (
          <>
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

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, (!isFormValid() || loading) && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={!isFormValid() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>{t('sendCode')}</Text>
              )}
            </TouchableOpacity>
            
            <Text style={styles.infoText}>
              {t('infoText')}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.label}>{t('otpLabel')} *</Text>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (otpInputRefs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(index, value)}
                  onKeyPress={({ nativeEvent: { key } }) => handleOtpKeyPress(index, key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  editable={!loading}
                  selectTextOnFocus
                />
              ))}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, (!isFormValid() || loading) && styles.buttonDisabled]}
              onPress={() => handleVerifyOTP()}
              disabled={!isFormValid() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>{t('verify')}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                {resendCountdown > 0 
                  ? `${t('resendIn')} ${resendCountdown} ${t('seconds')}`
                  : "Didn't receive the code?"}
              </Text>
              {resendCountdown === 0 && (
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleSendOTP}
                  disabled={loading}
                >
                  <Text style={[
                    styles.resendButtonText,
                    loading && styles.resendButtonDisabled
                  ]}>
                    {t('resend')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
