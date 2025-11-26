import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EmailRecord {
  email: string;
  source: 'waitlist' | 'cart' | 'checkout' | 'popup' | 'newsletter' | 'account';
  collectedAt: string;
  subscribed: boolean;
  tags: string[];
  metadata?: {
    cartValue?: number;
    cartItems?: any[];
    productViewed?: string;
    userAgent?: string;
  };
}

export interface AbandonedCart {
  email: string;
  cartItems: any[];
  cartValue: number;
  abandonedAt: string;
  reminderSent: {
    first: boolean;
    second: boolean;
    third: boolean;
  };
  recovered: boolean;
  recoveredAt?: string;
}

class EmailStorageService {
  private static readonly EMAILS_KEY = '@yemalin_emails';
  private static readonly ABANDONED_CARTS_KEY = '@yemalin_abandoned_carts';
  private static readonly MARKETING_PREFERENCES_KEY = '@yemalin_marketing_prefs';

  // Email Management
  async saveEmail(email: string, source: EmailRecord['source'], metadata?: EmailRecord['metadata']): Promise<EmailRecord> {
    try {
      const emails = await this.getAllEmails();
      const existingEmail = emails.find(e => e.email.toLowerCase() === email.toLowerCase());
      
      const emailRecord: EmailRecord = {
        email: email.toLowerCase(),
        source: existingEmail ? existingEmail.source : source,
        collectedAt: existingEmail ? existingEmail.collectedAt : new Date().toISOString(),
        subscribed: existingEmail?.subscribed ?? true,
        tags: existingEmail ? [...new Set([...existingEmail.tags, source])] : [source],
        metadata: existingEmail ? { ...existingEmail.metadata, ...metadata } : metadata,
      };

      const updatedEmails = emails.filter(e => e.email.toLowerCase() !== email.toLowerCase());
      updatedEmails.push(emailRecord);
      
      await AsyncStorage.setItem(EmailStorageService.EMAILS_KEY, JSON.stringify(updatedEmails));
      
      console.log('📧 Email saved:', { email, source, totalEmails: updatedEmails.length });
      
      return emailRecord;
    } catch (error) {
      console.error('Error saving email:', error);
      throw error;
    }
  }

  async getAllEmails(): Promise<EmailRecord[]> {
    try {
      const data = await AsyncStorage.getItem(EmailStorageService.EMAILS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting emails:', error);
      return [];
    }
  }

  async getEmailByAddress(email: string): Promise<EmailRecord | null> {
    const emails = await this.getAllEmails();
    return emails.find(e => e.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async updateEmailSubscription(email: string, subscribed: boolean): Promise<void> {
    const emails = await this.getAllEmails();
    const updatedEmails = emails.map(e => 
      e.email.toLowerCase() === email.toLowerCase() 
        ? { ...e, subscribed } 
        : e
    );
    await AsyncStorage.setItem(EmailStorageService.EMAILS_KEY, JSON.stringify(updatedEmails));
  }

  async getEmailCount(): Promise<number> {
    const emails = await this.getAllEmails();
    return emails.length;
  }

  async getSubscribedCount(): Promise<number> {
    const emails = await this.getAllEmails();
    return emails.filter(e => e.subscribed).length;
  }

  // Abandoned Cart Management
  async saveAbandonedCart(email: string, cartItems: any[]): Promise<AbandonedCart> {
    try {
      const carts = await this.getAllAbandonedCarts();
      const cartValue = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const abandonedCart: AbandonedCart = {
        email: email.toLowerCase(),
        cartItems,
        cartValue,
        abandonedAt: new Date().toISOString(),
        reminderSent: {
          first: false,
          second: false,
          third: false,
        },
        recovered: false,
      };

      // Remove existing abandoned cart for this email if exists
      const updatedCarts = carts.filter(c => c.email.toLowerCase() !== email.toLowerCase());
      updatedCarts.push(abandonedCart);
      
      await AsyncStorage.setItem(EmailStorageService.ABANDONED_CARTS_KEY, JSON.stringify(updatedCarts));
      
      console.log('🛒 Abandoned cart saved:', { email, cartValue, items: cartItems.length });
      
      return abandonedCart;
    } catch (error) {
      console.error('Error saving abandoned cart:', error);
      throw error;
    }
  }

  async getAllAbandonedCarts(): Promise<AbandonedCart[]> {
    try {
      const data = await AsyncStorage.getItem(EmailStorageService.ABANDONED_CARTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting abandoned carts:', error);
      return [];
    }
  }

  async getAbandonedCartByEmail(email: string): Promise<AbandonedCart | null> {
    const carts = await this.getAllAbandonedCarts();
    return carts.find(c => c.email.toLowerCase() === email.toLowerCase() && !c.recovered) || null;
  }

  async markReminderSent(email: string, reminderNumber: 1 | 2 | 3): Promise<void> {
    const carts = await this.getAllAbandonedCarts();
    const updatedCarts = carts.map(cart => {
      if (cart.email.toLowerCase() === email.toLowerCase() && !cart.recovered) {
        return {
          ...cart,
          reminderSent: {
            ...cart.reminderSent,
            [`${reminderNumber === 1 ? 'first' : reminderNumber === 2 ? 'second' : 'third'}`]: true,
          },
        };
      }
      return cart;
    });
    await AsyncStorage.setItem(EmailStorageService.ABANDONED_CARTS_KEY, JSON.stringify(updatedCarts));
  }

  async markCartRecovered(email: string): Promise<void> {
    const carts = await this.getAllAbandonedCarts();
    const updatedCarts = carts.map(cart => {
      if (cart.email.toLowerCase() === email.toLowerCase()) {
        return {
          ...cart,
          recovered: true,
          recoveredAt: new Date().toISOString(),
        };
      }
      return cart;
    });
    await AsyncStorage.setItem(EmailStorageService.ABANDONED_CARTS_KEY, JSON.stringify(updatedCarts));
  }

  async getAbandonedCartsNeedingReminder(): Promise<AbandonedCart[]> {
    const carts = await this.getAllAbandonedCarts();
    const now = Date.now();
    
    return carts.filter(cart => {
      if (cart.recovered) return false;
      
      const abandonedTime = new Date(cart.abandonedAt).getTime();
      const hoursSinceAbandoned = (now - abandonedTime) / (1000 * 60 * 60);
      
      // First reminder: 1 hour
      if (!cart.reminderSent.first && hoursSinceAbandoned >= 1) {
        return true;
      }
      
      // Second reminder: 24 hours
      if (cart.reminderSent.first && !cart.reminderSent.second && hoursSinceAbandoned >= 24) {
        return true;
      }
      
      // Third reminder: 72 hours
      if (cart.reminderSent.second && !cart.reminderSent.third && hoursSinceAbandoned >= 72) {
        return true;
      }
      
      return false;
    });
  }

  // Marketing Preferences
  async saveMarketingPreferences(email: string, preferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  }): Promise<void> {
    try {
      const prefs = await this.getMarketingPreferences();
      prefs[email.toLowerCase()] = preferences;
      await AsyncStorage.setItem(EmailStorageService.MARKETING_PREFERENCES_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Error saving marketing preferences:', error);
    }
  }

  async getMarketingPreferences(): Promise<Record<string, { email: boolean; sms: boolean; push: boolean }>> {
    try {
      const data = await AsyncStorage.getItem(EmailStorageService.MARKETING_PREFERENCES_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting marketing preferences:', error);
      return {};
    }
  }

  // Analytics
  async getEmailStats(): Promise<{
    total: number;
    subscribed: number;
    bySource: Record<string, number>;
    abandonedCarts: number;
    recoveredCarts: number;
    recoveryRate: number;
  }> {
    const emails = await this.getAllEmails();
    const carts = await this.getAllAbandonedCarts();
    
    const bySource: Record<string, number> = {};
    emails.forEach(email => {
      email.tags.forEach(tag => {
        bySource[tag] = (bySource[tag] || 0) + 1;
      });
    });

    const recoveredCarts = carts.filter(c => c.recovered).length;
    const totalAbandoned = carts.length;
    
    return {
      total: emails.length,
      subscribed: emails.filter(e => e.subscribed).length,
      bySource,
      abandonedCarts: totalAbandoned,
      recoveredCarts,
      recoveryRate: totalAbandoned > 0 ? (recoveredCarts / totalAbandoned) * 100 : 0,
    };
  }
}

export const emailStorage = new EmailStorageService();
