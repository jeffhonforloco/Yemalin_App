import React, { useState, useEffect } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { trpc } from "@/lib/trpc";

// Enable/disable backend integration
// Set to true once backend is deployed and configured
const USE_BACKEND_API = false;

interface User {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  memberSince: string;
  addresses?: Address[];
  phoneNumber?: string;
  profileImage?: string;
  isVip?: boolean;
  vipTier?: string;
}

interface Address {
  id: string;
  type: "shipping" | "billing";
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

interface AuthContextType {
  user: User | null;
  isVIP: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateTotalSpent: (amount: number) => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updateProfileImage: (imageUri: string) => Promise<void>;
  addAddress: (address: Omit<Address, "id">) => Promise<void>;
  updateAddress: (id: string, updates: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextType>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // VIP status requires at least $500 spent
  const isVIP = user ? (Number(user.totalSpent) || 0) >= 500 : false;
  const isAuthenticated = !!user;

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      const userData = await AsyncStorage.getItem("@yemalin_user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        // Ensure totalSpent is a number and not undefined
        if (parsedUser.totalSpent === undefined || parsedUser.totalSpent === null || isNaN(parsedUser.totalSpent)) {
          parsedUser.totalSpent = 0;
        }
        // Ensure totalSpent is a valid number and not negative
        parsedUser.totalSpent = Math.max(0, Number(parsedUser.totalSpent) || 0);
        
        // Debug logging
        console.log("Loading user:", parsedUser.email, "Total spent:", parsedUser.totalSpent);
        
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (userData: User | null) => {
    try {
      if (userData) {
        await AsyncStorage.setItem("@yemalin_user", JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem("@yemalin_user");
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const login = async (email: string, password: string, name?: string) => {
    if (USE_BACKEND_API) {
      // Use real backend API
      try {
        if (name) {
          // Sign up
          const response = await fetch(`${process.env.EXPO_PUBLIC_RORK_API_BASE_URL}/api/trpc/auth.signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              password,
              name,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Signup failed');
          }

          const data = await response.json();
          const { user: apiUser, tokens } = data.result.data;

          // Store JWT token
          await AsyncStorage.setItem("@yemalin_auth_token", tokens.accessToken);
          await AsyncStorage.setItem("@yemalin_refresh_token", tokens.refreshToken);

          const user: User = {
            id: apiUser.id,
            name: apiUser.name || '',
            email: apiUser.email,
            totalSpent: apiUser.totalSpent || 0,
            memberSince: new Date().toISOString(),
            isVip: apiUser.isVip,
            vipTier: apiUser.vipTier,
          };

          setUser(user);
          await saveUser(user);
        } else {
          // Login
          const response = await fetch(`${process.env.EXPO_PUBLIC_RORK_API_BASE_URL}/api/trpc/auth.login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              password,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
          }

          const data = await response.json();
          const { user: apiUser, tokens } = data.result.data;

          // Store JWT token
          await AsyncStorage.setItem("@yemalin_auth_token", tokens.accessToken);
          await AsyncStorage.setItem("@yemalin_refresh_token", tokens.refreshToken);

          const user: User = {
            id: apiUser.id,
            name: apiUser.name || '',
            email: apiUser.email,
            totalSpent: apiUser.totalSpent || 0,
            memberSince: new Date().toISOString(),
            isVip: apiUser.isVip,
            vipTier: apiUser.vipTier,
            profileImage: apiUser.profileImage,
          };

          setUser(user);
          await saveUser(user);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        throw error;
      }
    } else {
      // Use mock data (current implementation)
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if user already exists (for login)
      const existingUserData = await AsyncStorage.getItem("@yemalin_users");
      const users = existingUserData ? JSON.parse(existingUserData) : {};

      let mockUser: User;

      if (name) {
        // Sign up - create new user
        mockUser = {
          id: Date.now().toString(),
          name: name,
          email,
          totalSpent: 0, // New users start with 0 spent
          memberSince: new Date().toISOString(),
          addresses: [],
          phoneNumber: "",
        };

        // Save user to users database
        users[email] = { ...mockUser, password }; // In production, password would be hashed
        await AsyncStorage.setItem("@yemalin_users", JSON.stringify(users));
      } else {
        // Sign in - check existing user
        if (email === "guest@yemalin.com") {
          mockUser = {
            id: "guest",
            name: "Guest User",
            email,
            totalSpent: 0,
            memberSince: new Date().toISOString(),
            addresses: [],
          };
        } else if (users[email]) {
          // User exists, use their data
          mockUser = users[email];
          delete (mockUser as any).password; // Remove password from user object
          // Ensure totalSpent is a number
          if (mockUser.totalSpent === undefined || mockUser.totalSpent === null) {
            mockUser.totalSpent = 0;
          }
        } else {
          // For demo purposes, create a default user if not found
          mockUser = {
            id: Date.now().toString(),
            name: email.split('@')[0].replace(/[._]/g, ' ').split(' ').map((word: string) =>
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '),
            email,
            totalSpent: 0, // New users start with 0 spent
            memberSince: new Date().toISOString(),
            addresses: [],
          };

          // Save this user for future logins
          users[email] = { ...mockUser, password };
          await AsyncStorage.setItem("@yemalin_users", JSON.stringify(users));
        }
      }

      setUser(mockUser);
      await saveUser(mockUser);
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out user...");

      // Clear user state first
      setUser(null);

      // Clear AsyncStorage
      const itemsToRemove = [
        "@yemalin_user",
        "@yemalin_cart"
      ];

      // If using backend API, also clear tokens
      if (USE_BACKEND_API) {
        itemsToRemove.push("@yemalin_auth_token");
        itemsToRemove.push("@yemalin_refresh_token");
      }

      await Promise.all(itemsToRemove.map(item => AsyncStorage.removeItem(item)));

      // For web, also clear localStorage as fallback
      if (Platform.OS === 'web') {
        try {
          if (typeof localStorage !== 'undefined') {
            itemsToRemove.forEach(item => localStorage.removeItem(item));
            // Don't clear users database as it contains all registered users
          }
        } catch (webError) {
          console.log('Web localStorage clear failed:', webError);
        }
      }

      console.log("Logout completed successfully");
    } catch (error) {
      console.error("Error during logout:", error);
      // Force clear state even if storage fails
      setUser(null);
      throw error; // Re-throw to let caller handle
    }
  };

  const updateTotalSpent = (amount: number) => {
    if (user) {
      const currentSpent = Number(user.totalSpent) || 0;
      const updatedUser = { ...user, totalSpent: currentSpent + amount };
      setUser(updatedUser);
      saveUser(updatedUser);
      
      // Also update in users database
      AsyncStorage.getItem("@yemalin_users").then(existingUserData => {
        const users = existingUserData ? JSON.parse(existingUserData) : {};
        if (users[user.email]) {
          users[user.email] = { ...users[user.email], totalSpent: updatedUser.totalSpent };
          AsyncStorage.setItem("@yemalin_users", JSON.stringify(users));
        }
      });
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await saveUser(updatedUser);
      
      // Also update in users database
      const existingUserData = await AsyncStorage.getItem("@yemalin_users");
      const users = existingUserData ? JSON.parse(existingUserData) : {};
      if (users[user.email]) {
        users[user.email] = { ...users[user.email], ...updates };
        await AsyncStorage.setItem("@yemalin_users", JSON.stringify(users));
      }
    }
  };

  const updateProfileImage = async (imageUri: string) => {
    if (user) {
      const updatedUser = { ...user, profileImage: imageUri };
      setUser(updatedUser);
      await saveUser(updatedUser);
      
      // Also update in users database
      const existingUserData = await AsyncStorage.getItem("@yemalin_users");
      const users = existingUserData ? JSON.parse(existingUserData) : {};
      if (users[user.email]) {
        users[user.email] = { ...users[user.email], profileImage: imageUri };
        await AsyncStorage.setItem("@yemalin_users", JSON.stringify(users));
      }
    }
  };

  const addAddress = async (address: Omit<Address, "id">) => {
    if (user) {
      const newAddress: Address = {
        ...address,
        id: Date.now().toString(),
      };
      
      // If this is the first address or marked as default, set other addresses as non-default
      const addresses = user.addresses || [];
      if (newAddress.isDefault || addresses.length === 0) {
        addresses.forEach(addr => addr.isDefault = false);
        newAddress.isDefault = true;
      }
      
      const updatedUser = {
        ...user,
        addresses: [...addresses, newAddress],
      };
      
      setUser(updatedUser);
      await saveUser(updatedUser);
    }
  };

  const updateAddress = async (id: string, updates: Partial<Address>) => {
    if (user && user.addresses) {
      const addresses = user.addresses.map(addr => {
        if (addr.id === id) {
          return { ...addr, ...updates };
        }
        // If setting this as default, unset others
        if (updates.isDefault) {
          return { ...addr, isDefault: false };
        }
        return addr;
      });
      
      const updatedUser = { ...user, addresses };
      setUser(updatedUser);
      await saveUser(updatedUser);
    }
  };

  const deleteAddress = async (id: string) => {
    if (user && user.addresses) {
      const addresses = user.addresses.filter(addr => addr.id !== id);
      const updatedUser = { ...user, addresses };
      setUser(updatedUser);
      await saveUser(updatedUser);
    }
  };

  return {
    user,
    isVIP,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateTotalSpent,
    updateProfile,
    updateProfileImage,
    addAddress,
    updateAddress,
    deleteAddress,
  };
});