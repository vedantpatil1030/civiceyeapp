import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { authAPI } from '../services/api';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });
  const [loading, setLoading] = useState(false);
  
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
  };

  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const placeholderColor = isDarkMode ? '#888888' : '#666666';

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const { fullName, email, password, confirmPassword, phoneNumber } = formData;

    if (!fullName || !email || !password || !confirmPassword || !phoneNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const userData = {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
      };
      
      const response = await authAPI.register(userData);
      
      if (response.success) {
        Alert.alert(
          'Registration Successful',
          `Welcome to CivicEye, ${response.data.user.name}! Please log in to continue.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: placeholderColor }]}>
              Join CivicEye to report and track civic issues
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Full Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                    color: textColor,
                    borderColor: isDarkMode ? '#444' : '#ddd',
                  },
                ]}
                placeholder="Enter your full name"
                placeholderTextColor={placeholderColor}
                value={formData.fullName}
                onChangeText={(value) => updateFormData('fullName', value)}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                    color: textColor,
                    borderColor: isDarkMode ? '#444' : '#ddd',
                  },
                ]}
                placeholder="Enter your email"
                placeholderTextColor={placeholderColor}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Phone Number</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                    color: textColor,
                    borderColor: isDarkMode ? '#444' : '#ddd',
                  },
                ]}
                placeholder="Enter your phone number"
                placeholderTextColor={placeholderColor}
                value={formData.phoneNumber}
                onChangeText={(value) => updateFormData('phoneNumber', value)}
                keyboardType="phone-pad"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                    color: textColor,
                    borderColor: isDarkMode ? '#444' : '#ddd',
                  },
                ]}
                placeholder="Create a password"
                placeholderTextColor={placeholderColor}
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: textColor }]}>Confirm Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                    color: textColor,
                    borderColor: isDarkMode ? '#444' : '#ddd',
                  },
                ]}
                placeholder="Confirm your password"
                placeholderTextColor={placeholderColor}
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity 
              style={[styles.registerButton, loading && styles.registerButtonDisabled]} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: placeholderColor }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={[styles.signInText, { color: '#007AFF' }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonDisabled: {
    backgroundColor: '#999999',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  footerText: {
    fontSize: 16,
  },
  signInText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;
