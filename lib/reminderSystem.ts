import { emailStorage, AbandonedCart } from './emailStorage';

interface ReminderSchedule {
  hours: number;
  discount: number;
  message: string;
  subject: string;
}

export const REMINDER_SCHEDULES: ReminderSchedule[] = [
  {
    hours: 1,
    discount: 10,
    subject: 'Complete Your Purchase - 10% Off',
    message: 'Your exclusive pieces are waiting... Complete your order within the next hour and save 10%.',
  },
  {
    hours: 24,
    discount: 15,
    subject: 'Last Chance - 15% Off Your Cart',
    message: 'Only a few left in stock - secure yours now. Complete your order and save 15% today.',
  },
  {
    hours: 72,
    discount: 20,
    subject: 'Final Reminder - 20% Off Today Only',
    message: 'Final chance: Your cart expires soon. Complete your order now and save 20% - today only.',
  },
];

export class ReminderSystem {
  private static checkInterval: ReturnType<typeof setInterval> | null = null;
  private static isRunning = false;

  static async start() {
    if (this.isRunning) return;
    if (typeof window === 'undefined') return; // Skip during SSR/build
    
    this.isRunning = true;
    console.log('🔔 Reminder system started');
    
    // Check for carts needing reminders every 5 minutes
    this.checkInterval = setInterval(() => {
      this.processReminders();
    }, 5 * 60 * 1000); // 5 minutes

    // Run immediately on start
    await this.processReminders();
  }

  static stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('🔔 Reminder system stopped');
  }

  static async processReminders() {
    try {
      const cartsNeedingReminders = await emailStorage.getAbandonedCartsNeedingReminder();
      
      for (const cart of cartsNeedingReminders) {
        await this.sendReminder(cart);
      }
    } catch (error) {
      console.error('Error processing reminders:', error);
    }
  }

  static async sendReminder(cart: AbandonedCart) {
    try {
      const abandonedTime = new Date(cart.abandonedAt).getTime();
      const now = Date.now();
      const hoursSinceAbandoned = (now - abandonedTime) / (1000 * 60 * 60);

      let reminderNumber: 1 | 2 | 3 = 1;
      let schedule: ReminderSchedule | null = null;

      // Determine which reminder to send
      if (!cart.reminderSent.first && hoursSinceAbandoned >= 1) {
        reminderNumber = 1;
        schedule = REMINDER_SCHEDULES[0];
      } else if (cart.reminderSent.first && !cart.reminderSent.second && hoursSinceAbandoned >= 24) {
        reminderNumber = 2;
        schedule = REMINDER_SCHEDULES[1];
      } else if (cart.reminderSent.second && !cart.reminderSent.third && hoursSinceAbandoned >= 72) {
        reminderNumber = 3;
        schedule = REMINDER_SCHEDULES[2];
      }

      if (!schedule) return;

      // Mark reminder as sent
      await emailStorage.markReminderSent(cart.email, reminderNumber);

      // Send email reminder (this would integrate with your email service)
      await this.sendEmailReminder(cart, schedule);

      console.log(`📧 Reminder ${reminderNumber} sent to ${cart.email}`, {
        cartValue: cart.cartValue,
        discount: schedule.discount,
      });

      // Track conversion event
      // This would integrate with your marketing provider
      if (typeof window !== 'undefined' && (window as any).marketing?.trackConversion) {
        (window as any).marketing.trackConversion('abandoned_cart_reminder_sent', {
          email: cart.email,
          reminderNumber,
          cartValue: cart.cartValue,
          discount: schedule.discount,
        });
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  }

  static async sendEmailReminder(cart: AbandonedCart, schedule: ReminderSchedule) {
    // This would integrate with your email service (Klaviyo, SendGrid, etc.)
    // For now, we'll log and store the reminder
    
    const emailData = {
      to: cart.email,
      subject: schedule.subject,
      template: `abandoned_cart_reminder_${schedule.hours}h`,
      data: {
        cartItems: cart.cartItems,
        cartValue: cart.cartValue,
        discount: schedule.discount,
        discountCode: `CART${schedule.hours}H`,
        message: schedule.message,
        urgencyMessage: cart.cartItems.some((item: any) => item.stock <= 3) 
          ? '⚠️ Some items in your cart have limited stock remaining'
          : null,
      },
    };

    console.log('📧 EMAIL REMINDER PREPARED:', emailData);
    
    // In production, this would call your email service API
    // await klaviyo.sendEmail(emailData);
  }

  static async markCartRecovered(email: string) {
    await emailStorage.markCartRecovered(email);
    console.log(`✅ Cart recovered for ${email}`);
  }

  static getStats() {
    // This would provide statistics about reminder performance
    return {
      totalRemindersSent: 0, // Would be tracked
      recoveryRate: 0, // Would be calculated
      averageDiscount: REMINDER_SCHEDULES.reduce((sum, s) => sum + s.discount, 0) / REMINDER_SCHEDULES.length,
    };
  }
}

