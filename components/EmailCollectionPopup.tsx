import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { X, Mail, Gift } from 'lucide-react-native';
import { emailStorage } from '@/lib/emailStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EmailCollectionPopupProps {
  visible: boolean;
  onClose: () => void;
  source?: 'exit_intent' | 'time_delay' | 'scroll' | 'product_view';
  delay?: number; // seconds
  offer?: string;
}

export default function EmailCollectionPopup({
  visible,
  onClose,
  source = 'time_delay',
  delay = 30,
  offer = '15% OFF',
}: EmailCollectionPopupProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load last email if available
    AsyncStorage.getItem('@yemalin_last_email').then(savedEmail => {
      if (savedEmail) {
        setEmail(savedEmail);
      }
    });
  }, []);

  const handleSubmit = async () => {
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Save email
      await emailStorage.saveEmail(email.toLowerCase(), 'popup');

      // Save for future use
      await AsyncStorage.setItem('@yemalin_last_email', email.toLowerCase());

      // Close popup after successful submission
      setTimeout(() => {
        setLoading(false);
        onClose();
        setEmail('');
        setError('');
      }, 500);
    } catch (error) {
      console.error('Error saving email:', error);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    // Save preference to not show again for this session
    await AsyncStorage.setItem('@yemalin_popup_dismissed', Date.now().toString());
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
            <X size={20} color="#666" />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Gift size={40} color="#000" />
            </View>

            <Text style={styles.title}>JOIN THE ELITE CIRCLE</Text>
            <Text style={styles.subtitle}>
              Get {offer} on your first purchase + exclusive early access to new drops
            </Text>

            <View style={styles.inputContainer}>
              <Mail size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'JOINING...' : `CLAIM ${offer}`}
              </Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>
              By signing up, you agree to receive marketing emails. Unsubscribe anytime.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    ...Platform.select({
      web: {
        outline: 'none',
      },
    }),
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  footerText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
});

