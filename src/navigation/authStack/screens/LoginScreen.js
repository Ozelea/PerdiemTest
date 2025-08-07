import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Colors from '../../../utils/Colors';
import CustomTextInput from '../../../components/CustomTextInput';
import CustomButton from '../../../components/CustomButton';
import SocialButton from '../../../components/SocialButton';
import Storage from '../../../utils/Storage';
import {useMMKVStorage} from 'react-native-mmkv-storage';
import {postRequest, setAuthToken} from '../../../utils/APIController';
import auth from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

export default function LoginScreen({navigation}) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useMMKVStorage('user', Storage);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '589468475434-sjd3uh7sv290aq4qhobubv62thnpk8m3.apps.googleusercontent.com',
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: ''}));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await postRequest('auth', {
        email: formData.email,
        password: formData.password,
      });

      if (response?.token) {
        const userData = {
          email: formData.email,
          name: 'User',
          token: response.token,
        };

        // Store the auth token using the new utility function
        setAuthToken(response.token);

        setUser(userData);
        Alert.alert('Success', response?.message || 'Logged in successfully!');
      } else {
        Alert.alert(
          'Error',
          response?.message || 'Login failed. Please try again.',
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Network error. Please check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      const userInfo = await GoogleSignin.signIn();

      const googleCredential = auth.GoogleAuthProvider.credential(
        userInfo.data.idToken,
      );
      const authResult = await auth().signInWithCredential(googleCredential);

      const userData = {
        uid: authResult.user.uid,
        email: authResult.user.email,
        displayName: authResult.user.displayName,
        photoURL: authResult.user.photoURL,
        loginMethod: 'google',
        loginTime: new Date().toISOString(),
      };

      setUser(userData);

      Alert.alert(
        'Welcome!',
        `Hello ${
          userData.displayName || userData.email
        }! You've successfully signed in with Google.`,
        [{text: 'Continue', onPress: () => navigation.replace('AppStack')}],
      );
    } catch (error) {
      const getErrorMessage = () => {
        switch (error.code) {
          case 'statusCodes.SIGN_IN_CANCELLED':
            return 'Sign-In was cancelled.';
          case 'statusCodes.IN_PROGRESS':
            return 'Sign-In is already in progress.';
          case 'statusCodes.PLAY_SERVICES_NOT_AVAILABLE':
            return 'Google Play Services is not available on this device.';
          case 'auth/account-exists-with-different-credential':
            return 'An account already exists with the same email address but different sign-in credentials.';
          case 'auth/invalid-credential':
            return 'The credential received is malformed or has expired.';
          case 'auth/operation-not-allowed':
            return 'Google Sign-In is not enabled for this project.';
          case 'auth/user-disabled':
            return 'The user account has been disabled by an administrator.';
          default:
            return error.message || 'Google Sign-In failed. Please try again.';
        }
      };

      Alert.alert('Sign-In Error', getErrorMessage());
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradients.background}
        style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <Text style={styles.logoIcon}>🔐</Text>
                </View>
              </View>

              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to your account to continue
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <CustomTextInput
                label="Email Address"
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={value => handleInputChange('email', value)}
                keyboardType="email-address"
                error={errors.email}
              />

              <CustomTextInput
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={value => handleInputChange('password', value)}
                secureTextEntry
                error={errors.password}
              />

              <CustomButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
              />

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Sign In */}
              <SocialButton onPress={handleGoogleSignIn} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: Colors.white,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowMedium,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoIcon: {
    fontSize: 32,
    color: Colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkIcon: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  rememberText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  forgotText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
