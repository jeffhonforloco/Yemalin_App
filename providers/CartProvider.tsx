import { useState, useCallback, useEffect, useRef } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { emailStorage } from "@/lib/emailStorage";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  size: string;
  image: string;
  quantity: number;
  description?: string;
  addedAt?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  isLoading: boolean;
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (id: string, size: string) => Promise<void>;
  updateQuantity: (id: string, size: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getItemQuantity: (id: string, size: string) => number;
  isInCart: (id: string, size: string) => boolean;
  trackAbandonedCart: (email?: string) => Promise<void>;
}

export const [CartProvider, useCart] = createContextHook<CartContextType>(() => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const abandonCartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cartLastModifiedRef = useRef<Date>(new Date());

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Load cart from storage on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Track abandoned cart when user leaves with items in cart
  useEffect(() => {
    if (items.length > 0) {
      // Reset timer whenever cart changes
      cartLastModifiedRef.current = new Date();
      
      if (abandonCartTimeoutRef.current) {
        clearTimeout(abandonCartTimeoutRef.current);
      }

      // Set timer to mark cart as abandoned after 30 minutes of inactivity
      abandonCartTimeoutRef.current = setTimeout(async () => {
        if (items.length > 0) {
          const userData = await AsyncStorage.getItem('@yemalin_user');
          const email = userData ? JSON.parse(userData)?.email : null;
          const lastEmail = await AsyncStorage.getItem('@yemalin_last_email');
          const emailToUse = email || lastEmail;
          if (emailToUse) {
            await trackAbandonedCart(emailToUse);
          }
        }
      }, 30 * 60 * 1000) as any; // 30 minutes

      return () => {
        if (abandonCartTimeoutRef.current) {
          clearTimeout(abandonCartTimeoutRef.current);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const loadCart = async () => {
    try {
      setIsLoading(true);
      const cartData = await AsyncStorage.getItem("@yemalin_cart");
      if (cartData) {
        setItems(JSON.parse(cartData));
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCart = async (cartItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem("@yemalin_cart", JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error saving cart:", error);
    }
  };

  const addToCart = useCallback(async (item: CartItem) => {
    const newItems = await new Promise<CartItem[]>((resolve) => {
      setItems(prev => {
        const existingItem = prev.find(i => i.id === item.id && i.size === item.size);
        let updated;
        if (existingItem) {
          updated = prev.map(i => 
            i.id === item.id && i.size === item.size 
              ? { ...i, quantity: i.quantity + item.quantity, addedAt: new Date().toISOString() }
              : i
          );
        } else {
          updated = [...prev, { ...item, addedAt: new Date().toISOString() }];
        }
        resolve(updated);
        return updated;
      });
    });
    await saveCart(newItems);
  }, []);

  const removeFromCart = useCallback(async (id: string, size: string) => {
    const newItems = await new Promise<CartItem[]>((resolve) => {
      setItems(prev => {
        const updated = prev.filter(item => !(item.id === id && item.size === size));
        resolve(updated);
        return updated;
      });
    });
    await saveCart(newItems);
  }, []);

  const updateQuantity = useCallback(async (id: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(id, size);
      return;
    }
    
    const newItems = await new Promise<CartItem[]>((resolve) => {
      setItems(prev => {
        const updated = prev.map(item => 
          item.id === id && item.size === size 
            ? { ...item, quantity }
            : item
        );
        resolve(updated);
        return updated;
      });
    });
    await saveCart(newItems);
  }, [removeFromCart]);

  const clearCart = useCallback(async () => {
    setItems([]);
    await saveCart([]);
  }, []);

  const getTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);

  const getItemQuantity = useCallback((id: string, size: string) => {
    const item = items.find(i => i.id === id && i.size === size);
    return item ? item.quantity : 0;
  }, [items]);

  const isInCart = useCallback((id: string, size: string) => {
    return items.some(i => i.id === id && i.size === size);
  }, [items]);

  const trackAbandonedCart = useCallback(async (email?: string) => {
    if (items.length === 0) return;
    
    try {
      let emailToUse = email;
      if (!emailToUse) {
        const userData = await AsyncStorage.getItem('@yemalin_user');
        emailToUse = userData ? JSON.parse(userData)?.email : null;
      }
      if (!emailToUse) {
        const lastEmail = await AsyncStorage.getItem('@yemalin_last_email');
        emailToUse = lastEmail ?? undefined;
      }
      if (!emailToUse) return;

      // Save abandoned cart
      await emailStorage.saveAbandonedCart(emailToUse, items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        size: item.size,
        image: item.image,
        quantity: item.quantity,
      })));

      // Also save email if not already saved
      await emailStorage.saveEmail(emailToUse, 'cart', {
        cartValue: getTotal(),
        cartItems: items,
      });

      console.log('🛒 Cart abandoned tracked:', { email: emailToUse, itemCount: items.length, total: getTotal() });
    } catch (error) {
      console.error('Error tracking abandoned cart:', error);
    }
  }, [items, getTotal]);

  return {
    items,
    itemCount,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getItemQuantity,
    isInCart,
    trackAbandonedCart,
  };
});