
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
  otpInputFocused: {
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
    fontWeight: '600',
    color: colors.primary,
  },
  resendButtonDisabled: {
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
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
});

export default function EmailAuthScreen() {
  const { language, userType, setUserEmail, setIsEmailVerified } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');
  const otpRefs = useRef<Array<TextInput | null>>([]);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      emailAuth: { en: 'Email Authentication', es: 'Autenticación de correo' },
      enterEmail: { en: 'Enter your email address', es: 'Ingrese su dirección de correo' },
      emailPlaceholder: { en: 'your@email.com', es: 'tu@correo.com' },
      sendCode: { en: 'Send Verification Code', es: 'Enviar código de verificación' },
      verifyCode: { en: 'Verify Code', es: 'Verificar código' },
      enterCode: { en: 'Enter the 6-digit code sent to your email', es: 'Ingrese el código de 6 dígitos enviado a su correo' },
      resendCode: { en: 'Didn&apos;t receive the code?', es: '¿No recibiste el código?' },
      resend: { en: 'Resend', es: 'Reenviar' },
      startRegistration: { en: 'Start Registration', es: 'Iniciar registro' },
      invalidEmail: { en: 'Please enter a valid email address', es: 'Por favor ingrese un correo válido' },
      codeSent: { en: 'Verification code sent! Check your email.', es: 'Código enviado! Revisa tu correo.' },
      invalidCode: { en: 'Please enter the complete 6-digit code', es: 'Por favor ingrese el código completo de 6 dígitos' },
      checkSpam: { en: 'Check your spam folder if you don&apos;t see the email', es: 'Revisa tu carpeta de spam si no ves el correo' },
      errorSending: { en: 'Failed to send verification code. Please try again.', es: 'Error al enviar código. Intente de nuevo.' },
      errorVerifying: { en: 'Invalid verification code. Please try again.', es: 'Código inválido. Intente de nuevo.' },
    };
    return translations[key]?.[language] || key;
  };

  const parseErrorMessage = (error: any): string => {
    console.log('[OTP] Parsing error:', error);
    
    // If error is a string
    if (typeof error === 'string') {
      // Check for common error patterns and provide helpful messages
      if (error.includes('Failed to send OTP') || error.includes('Failed to send email')) {
        return 'Unable to send verification email. Please check your email address and try again.';
      }
      if (error.includes('Email service not configured')) {
        return 'Email service is temporarily unavailable. Please try again later.';
      }
      if (error.includes('Invalid email')) {
        return 'Please enter a valid email address.';
      }
      return error;
    }
    
    // If error has a message property
    if (error?.message) {
      // Extract JSON error if present
      const jsonMatch = error.message.match(/\{.*"error".*\}/);
      if (jsonMatch) {
        try {
          const errorObj = JSON.parse(jsonMatch[0]);
          const errorMsg = errorObj.error || errorObj.message || error.message;
          // Apply same helpful message transformations
          if (errorMsg.includes('Failed to send OTP') || errorMsg.includes('Failed to send email')) {
            return 'Unable to send verification email. Please check your email address and try again.';
          }
          return errorMsg;
        } catch (e) {
          console.log('[OTP] Failed to parse JSON error:', e);
        }
      }
      
      // Apply helpful message transformations to raw message
      if (error.message.includes('Failed to send OTP') || error.message.includes('Failed to send email')) {
        return 'Unable to send verification email. Please check your email address and try again.';
      }
      return error.message;
    }
    
    // If error is an object with error property
    if (error?.error) {
      if (error.error.includes('Failed to send OTP') || error.error.includes('Failed to send email')) {
        return 'Unable to send verification email. Please check your email address and try again.';
      }
      return error.error;
    }
    
    return 'An unexpected error occurred. Please try again.';
  };

  const handleSendOTP = async () => {
    // Clear previous errors
    setError('');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError(t('invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      console.log('[OTP] Sending OTP to:', email);
      console.log('[OTP] Request timestamp:', new Date().toISOString());
      
      const { apiPost } = await import('@/utils/api');
      const response = await apiPost('/auth/send-otp', { email });
      console.log('[OTP] Response received:', response);
      console.log('[OTP] Response timestamp:', new Date().toISOString());
      
      if (!response.success) {
        const errorMsg = response.message || response.error || 'Failed to send OTP';
        console.error('[OTP] Backend returned error:', errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('[OTP] OTP sent successfully, expires in:', response.expiresIn, 'seconds');
      setOtpSent(true);
      setResendTimer(60);
      
      // Start countdown timer
      const interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      Alert.alert('Success', t('codeSent'));
    } catch (error: any) {
      console.error('[OTP] Error sending OTP:', error);
      console.error('[OTP] Error type:', typeof error);
      console.error('[OTP] Error details:', JSON.stringify(error, null, 2));
      
      const errorMessage = parseErrorMessage(error);
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    // Clear error when user starts typing
    if (error) setError('');

    if (value.length > 1) {
      value = value[value.length - 1];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    // Clear previous errors
    setError('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError(t('invalidCode'));
      return;
    }

    setLoading(true);
    try {
      console.log('[OTP] Verifying OTP:', otpCode, 'for email:', email);
      
      const { apiPost } = await import('@/utils/api');
      const response = await apiPost('/auth/verify-otp', { 
        email, 
        code: otpCode 
      });
      console.log('[OTP] Verification response:', response);
      
      if (!response.success) {
        throw new Error(response.message || response.error || 'Invalid OTP');
      }
      
      setUserEmail(email);
      setIsEmailVerified(true);
      
      // Navigate to registration
      if (userType === 'parent') {
        router.push('/registration/parent');
      } else {
        router.push('/registration/doula');
      }
    } catch (error: any) {
      console.error('[OTP] Error verifying OTP:', error);
      const errorMessage = parseErrorMessage(error);
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
      
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.subtitle}>
          {otpSent ? t('enterCode') : t('enterEmail')}
        </Text>

        {!otpSent ? (
          <>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder={t('emailPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>{t('sendCode')}</Text>
              )}
            </TouchableOpacity>
            
            <Text style={styles.infoText}>
              We&apos;ll send a 6-digit verification code to your email address. The code will expire in 10 minutes.
            </Text>
          </>
        ) : (
          <>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => otpRefs.current[index] = ref}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={value => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!loading}
                />
              ))}
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>{t('startRegistration')}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>{t('resendCode')}</Text>
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleSendOTP}
                disabled={resendTimer > 0 || loading}
              >
                <Text style={[
                  styles.resendButtonText,
                  (resendTimer > 0 || loading) && styles.resendButtonDisabled
                ]}>
                  {resendTimer > 0 ? `${t('resend')} (${resendTimer}s)` : t('resend')}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.infoText}>{t('checkSpam')}</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
