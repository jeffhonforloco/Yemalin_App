import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Settings } from 'lucide-react-native';

// Hidden admin access button - triple tap to access
export default function AdminAccessButton() {
  const [tapCount, setTapCount] = React.useState(0);
  const [lastTap, setLastTap] = React.useState(0);

  const handlePress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      setTapCount(prev => prev + 1);
    } else {
      setTapCount(1);
    }

    setLastTap(now);

    // Open admin after 3 taps
    if (tapCount >= 2) {
      router.push('/admin' as any);
      setTapCount(0);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Settings size={16} color="#666" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    opacity: 0.3,
  },
});

