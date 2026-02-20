import { Tabs, router, usePathname } from "expo-router";
import { Home, ShoppingBag, Star, User } from "lucide-react-native";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from "react-native";
import { useCart } from "@/providers/CartProvider";

function TabBarIcon({ icon: Icon, color, focused }: { icon: any; color: string; focused: boolean }) {
  return (
    <View style={styles.iconContainer}>
      <Icon color={color} size={24} strokeWidth={focused ? 2 : 1.5} />
    </View>
  );
}

function WebNavBar() {
  const pathname = usePathname();
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const leftNavItems = [
    { name: "index", title: "YÈMALÍN", icon: Home, path: "/" },
  ];
  
  const centerNavItems = [
    { name: "shop", title: "SHOP", icon: ShoppingBag, path: "/shop" },
    { name: "vip", title: "VIP CLUB", icon: Star, path: "/vip" },
  ];
  
  const rightNavItems = [
    { name: "profile", title: "PROFILE", icon: User, path: "/profile" },
  ];
  
  return (
    <View style={styles.webNavBar}>
      <View style={styles.webNavContent}>
        {/* Left section - Logo */}
        <View style={styles.webNavLeft}>
          <TouchableOpacity
            style={styles.webLogoContainer}
            onPress={() => router.push("/")}
          >
            <Text style={styles.webLogo}>YÈMALÍN</Text>
            <Text style={styles.webLogoSubtext}>LUXURY ESSENTIALS</Text>
          </TouchableOpacity>
        </View>
        
        {/* Center section - Shop and VIP */}
        <View style={styles.webNavCenter}>
          {centerNavItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.webNavItem, isActive && styles.webNavItemActive]}
                onPress={() => router.push(item.path as any)}
              >
                <Text style={[styles.webNavText, isActive && styles.webNavTextActive]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Right section - Profile, Wishlist, Search, Cart */}
        <View style={styles.webNavRight}>
          <TouchableOpacity 
            style={styles.webNavIcon}
            onPress={() => router.push("/profile" as any)}
          >
            <User color="#000" size={20} strokeWidth={1.5} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.webCartButton}
            onPress={() => router.push("/cart" as any)}
          >
            <ShoppingBag color="#000" size={20} strokeWidth={1.5} />
            {itemCount > 0 && (
              <View style={styles.webCartBadge}>
                <Text style={styles.webCartBadgeText}>{itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function CartButton() {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <TouchableOpacity 
      style={styles.cartButton}
      onPress={() => router.push("/cart" as any)}
    >
      <ShoppingBag color="#000" size={24} strokeWidth={1.5} />
      {itemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{itemCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function TabLayout() {
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
  
  // For web large screens, use custom navigation
  if (isWeb && isLargeScreen) {
    return (
      <View style={styles.webContainer}>
        <WebNavBar />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="shop" />
          <Tabs.Screen name="vip" />
          <Tabs.Screen name="profile" />
        </Tabs>
      </View>
    );
  }
  
  // Mobile layout
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#999",
        headerShown: true,
        headerRight: () => <CartButton />,
        headerStyle: {
          backgroundColor: "#fff",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: "#f0f0f0",
        },
        headerTitleStyle: {
          fontSize: 28,
          fontWeight: "700" as const,
          letterSpacing: 2,
        },
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -5 },
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500" as const,
          letterSpacing: 0.5,
          textTransform: "uppercase" as any,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "YÈMALÍN",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Home} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "SHOP",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={ShoppingBag} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="vip"
        options={{
          title: "VIP CLUB",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Star} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "PROFILE",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={User} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: "relative",
  },
  cartButton: {
    position: "relative",
    marginRight: Platform.OS === 'web' ? 24 : 16,
    padding: Platform.OS === 'web' ? 8 : 4,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -8,
    backgroundColor: "#000",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold" as const,
  },
  
  // Web-specific styles
  webContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webNavBar: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 1000,
  },
  webNavContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 40,
    height: 70,
  },
  webNavLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-start",
  },
  webLogoContainer: {
    alignItems: "flex-start",
  },
  webLogo: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: 2,
    color: "#000",
    marginBottom: 2,
  },
  webLogoSubtext: {
    fontSize: 10,
    fontWeight: "400" as const,
    letterSpacing: 1.5,
    color: "#000",
    textTransform: "uppercase" as any,
  },
  webNavCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 40,
    flex: 1,
    justifyContent: "center",
  },
  webNavRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
    justifyContent: "flex-end",
  },
  webNavIcon: {
    padding: 8,
  },
  webNavItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    transition: "all 0.2s ease",
  },
  webNavItemActive: {
    backgroundColor: "#f8f9fa",
  },
  webNavText: {
    fontSize: 14,
    fontWeight: "500" as const,
    letterSpacing: 1,
    color: "#666",
    textTransform: "uppercase" as any,
  },
  webNavTextActive: {
    color: "#000",
    fontWeight: "600" as const,
  },
  webCartButton: {
    position: "relative",
    padding: 12,
    borderRadius: 8,
  },
  webCartBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#000",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  webCartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold" as const,
  },
});