import React from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  Platform,
  Dimensions,
} from "react-native";
import { 
  User, 
  Package, 
  Heart, 
  CreditCard, 
  Bell, 
  HelpCircle,
  LogOut,
  ChevronRight,
  Mail,
  Phone,
  Camera
} from "lucide-react-native";
import { useAuth } from "@/providers/AuthProvider";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";

export default function ProfileScreen() {
  const { user, isVIP, logout, isAuthenticated, isLoading, updateProfileImage } = useAuth();
  const [notifications, setNotifications] = React.useState(true);
  const [imageLoading, setImageLoading] = React.useState(false);
  const [screenData, setScreenData] = React.useState(Dimensions.get('window'));
  
  React.useEffect(() => {
    const onChange = (result: any) => {
      setScreenData(result.window);
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);
  
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = screenData.width >= 768;

  // VIP status is calculated in AuthProvider based on totalSpent >= 500

  // Redirect to login if not authenticated after loading
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to change your profile picture."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setImageLoading(true);
        const imageUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await updateProfileImage(imageUri);
        setImageLoading(false);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      setImageLoading(false);
      Alert.alert("Error", "Failed to update profile picture. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your camera to take a profile picture."
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setImageLoading(true);
        const imageUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await updateProfileImage(imageUri);
        setImageLoading(false);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      setImageLoading(false);
      Alert.alert("Error", "Failed to update profile picture. Please try again.");
    }
  };

  const showImageOptions = () => {
    const options = Platform.OS === "web" 
      ? [
          { text: "Choose from Library", onPress: pickImage },
          { text: "Cancel", style: "cancel" as const },
        ]
      : [
          { text: "Take Photo", onPress: takePhoto },
          { text: "Choose from Library", onPress: pickImage },
          { text: "Cancel", style: "cancel" as const },
        ];

    Alert.alert(
      "Change Profile Picture",
      "Select a photo for your profile",
      options
    );
  };

  const menuItems = [
    {
      icon: Package,
      title: "Order History",
      onPress: () => router.push("/order-history"),
    },
    {
      icon: Heart,
      title: "Waitlist",
      onPress: () => router.push("/waitlist"),
    },
    {
      icon: CreditCard,
      title: "Payment Methods",
      onPress: () => router.push("/payment-methods"),
    },
    {
      icon: Bell,
      title: "Notifications",
      hasSwitch: true,
      value: notifications,
      onValueChange: setNotifications,
    },
    {
      icon: HelpCircle,
      title: "Help & Support",
      onPress: () => router.push("/help-support"),
    },
  ];

  const containerStyle = isWeb && isLargeScreen ? 
    [styles.container, styles.webContainer] : styles.container;
  
  const contentStyle = isWeb && isLargeScreen ? 
    [styles.content, styles.webContent] : styles.content;

  return (
    <View style={containerStyle}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentStyle}
      >

        {/* User Info */}
        <View style={[styles.userSection, isWeb && isLargeScreen && styles.webUserSection]}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={showImageOptions}
            disabled={imageLoading}
          >
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <User size={40} color="#fff" />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <Camera size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.name || "Guest User"}</Text>
          <Text style={styles.userEmail}>{user?.email || "guest@yemalin.com"}</Text>
          {isVIP && (
            <View style={styles.vipBadge}>
              <Text style={styles.vipBadgeText}>VIP MEMBER</Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={[styles.menuSection, isWeb && isLargeScreen && styles.webMenuSection]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              disabled={item.hasSwitch}
            >
              <View style={styles.menuItemLeft}>
                <item.icon size={20} color="#000" />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              {item.hasSwitch ? (
                <Switch
                  value={item.value}
                  onValueChange={item.onValueChange}
                  trackColor={{ false: "#ddd", true: "#000" }}
                  thumbColor="#fff"
                />
              ) : (
                <ChevronRight size={20} color="#999" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* About Section */}
        <View style={[styles.aboutSection, isWeb && isLargeScreen && styles.webAboutSection]}>
          <Text style={styles.aboutTitle}>ABOUT YEMALIN</Text>
          <Text style={styles.aboutText}>
            Yemalin represents the pinnacle of minimalist luxury fashion. 
            Each piece in our collection is meticulously crafted from the finest materials, 
            embodying our commitment to timeless elegance and exceptional quality.
          </Text>
          <Text style={styles.aboutText}>
            Our black and white essentials are designed to transcend trends, 
            offering versatile pieces that form the foundation of a sophisticated wardrobe.
          </Text>
        </View>

        {/* Contact */}
        <View style={[styles.contactSection, isWeb && isLargeScreen && styles.webContactSection]}>
          <Text style={styles.contactTitle}>CONTACT US</Text>
          <TouchableOpacity style={styles.contactItem}>
            <Mail size={16} color="#666" />
            <Text style={styles.contactText}>admin@yemalin.com</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactItem}>
            <Phone size={16} color="#666" />
            <Text style={styles.contactText}>1-800-YEMALIN</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Access - Hidden, triple tap logo */}
        <TouchableOpacity
          style={styles.adminAccess}
          onPress={() => {
            // Simple admin access - in production, add proper auth
            router.push('/admin');
          }}
        >
          <Text style={styles.adminAccessText}>Admin Dashboard</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity 
          style={[styles.logoutButton, isWeb && isLargeScreen && styles.webLogoutButton]} 
          onPress={() => {
            const handleLogout = async () => {
              try {
                await logout();

                // Use router.push instead of replace to ensure proper navigation
                if (Platform.OS === 'web') {
                  // On web, we might need to force a page refresh to clear all state
                  window.location.href = '/login';
                } else {
                  router.replace("/login");
                }
              } catch (error) {
                console.error('Logout error:', error);
                // Force redirect even if logout fails
                if (Platform.OS === 'web') {
                  window.location.href = '/login';
                } else {
                  router.replace("/login");
                }
              }
            };
            
            if (isWeb) {
              // On web, use confirm dialog for better UX
              if (confirm("Are you sure you want to sign out?")) {
                handleLogout();
              }
            } else {
              // On mobile, use Alert
              Alert.alert(
                "Sign Out",
                "Are you sure you want to sign out?",
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Sign Out", 
                    onPress: handleLogout,
                    style: "destructive" 
                  },
                ]
              );
            }
          }}
        >
          <LogOut size={20} color="#d32f2f" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Admin Access */}
        <TouchableOpacity
          style={styles.adminAccess}
          onPress={() => {
            router.push('/admin');
          }}
        >
          <Text style={styles.adminAccessText}>ADMIN DASHBOARD</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webContainer: {
    backgroundColor: "#f8f9fa",
  },
  content: {
    flexGrow: 1,
  },
  webContent: {
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },

  userSection: {
    alignItems: "center",
    padding: 30,
  },
  webUserSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#000",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 18,
    fontWeight: "500" as const,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  vipBadge: {
    marginTop: 12,
    backgroundColor: "#FFD700",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  vipBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    letterSpacing: 1,
  },
  menuSection: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  webMenuSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 24,
    borderTopWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  aboutSection: {
    padding: 30,
    backgroundColor: "#fafafa",
  },
  webAboutSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: "300" as const,
    letterSpacing: 2,
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#666",
    marginBottom: 12,
  },
  contactSection: {
    padding: 30,
  },
  webContactSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 1,
    marginBottom: 16,
    color: "#666",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: "#666",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginHorizontal: 30,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  webLogoutButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 0,
    borderTopWidth: 0,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  logoutText: {
    fontSize: 14,
    color: "#d32f2f",
    fontWeight: "500" as const,
  },
  adminAccess: {
    marginHorizontal: 30,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#000",
    alignItems: "center",
    borderRadius: 8,
  },
  adminAccessText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 1,
    textTransform: "uppercase" as any,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: "#999",
    paddingVertical: 20,
  },
});