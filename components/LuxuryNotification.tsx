import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from "react-native";
import { Check, X, AlertCircle, Info } from "lucide-react-native";

type NotificationType = "success" | "error" | "warning" | "info";

interface LuxuryNotificationProps {
  type: NotificationType;
  title: string;
  message?: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export default function LuxuryNotification({
  type,
  title,
  message,
  visible,
  onDismiss,
  duration = 3000,
}: LuxuryNotificationProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      const timer = setTimeout(() => {
        dismissNotification();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismissNotification = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <Check size={20} color="#fff" />;
      case "error":
        return <X size={20} color="#fff" />;
      case "warning":
        return <AlertCircle size={20} color="#fff" />;
      case "info":
        return <Info size={20} color="#fff" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#2e7d32";
      case "error":
        return "#d32f2f";
      case "warning":
        return "#f57c00";
      case "info":
        return "#1976d2";
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>{getIcon()}</View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
        <TouchableOpacity onPress={dismissNotification} style={styles.closeButton}>
          <X size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 20,
    right: 20,
    borderRadius: 8,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  message: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
  },
});
