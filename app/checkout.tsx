import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useMarketing } from "@/providers/MarketingProvider";
import { router } from "expo-router";
import { CreditCard, MapPin, Check } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { emailStorage } from "@/lib/emailStorage";
import { ReminderSystem } from "@/lib/reminderSystem";

export default function CheckoutScreen() {
  const { items, clearCart, getTotal } = useCart();
  const { user, updateTotalSpent, isAuthenticated } = useAuth();
  const marketing = useMarketing();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"shipping" | "payment" | "review">("shipping");
  
  // Shipping form state
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  });

  // Payment form state
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    cardHolder: user?.name || "",
    expiryDate: "",
    cvv: "",
  });

  const subtotal = getTotal();
  const shipping = subtotal > 150 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  React.useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated, allow back navigation
      router.replace("/login" as any);
    }
  }, [isAuthenticated]);

  const validateShipping = () => {
    const required = ["fullName", "email", "phone", "address", "city", "state", "zipCode"];
    for (const field of required) {
      if (!shippingInfo[field as keyof typeof shippingInfo]) {
        Alert.alert("Missing Information", `Please enter your ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`);
        return false;
      }
    }
    return true;
  };

  const validatePayment = () => {
    if (!paymentInfo.cardNumber || paymentInfo.cardNumber.length < 16) {
      Alert.alert("Invalid Card", "Please enter a valid card number");
      return false;
    }
    if (!paymentInfo.expiryDate || !paymentInfo.expiryDate.match(/^\d{2}\/\d{2}$/)) {
      Alert.alert("Invalid Expiry", "Please enter expiry date in MM/YY format");
      return false;
    }
    if (!paymentInfo.cvv || paymentInfo.cvv.length < 3) {
      Alert.alert("Invalid CVV", "Please enter a valid CVV");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === "shipping") {
      if (validateShipping()) {
        setStep("payment");
      }
    } else if (step === "payment") {
      if (validatePayment()) {
        setStep("review");
      }
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create order object
      const orderId = `ORD-${Date.now().toString().slice(-8)}`;
      const order = {
        id: orderId,
        date: new Date().toISOString(),
        status: "processing" as const,
        total: Number(total.toFixed(2)),
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          size: item.size,
        })),
        shippingInfo,
        paymentMethod: {
          last4: paymentInfo.cardNumber.slice(-4),
          cardHolder: paymentInfo.cardHolder,
        },
      };
      
      // Save order to AsyncStorage
      if (user) {
        const ordersKey = `@yemalin_orders_${user.email}`;
        const existingOrdersData = await AsyncStorage.getItem(ordersKey);
        const existingOrders = existingOrdersData ? JSON.parse(existingOrdersData) : [];
        const updatedOrders = [order, ...existingOrders];
        await AsyncStorage.setItem(ordersKey, JSON.stringify(updatedOrders));
      }
      
      // Update user's total spent
      updateTotalSpent(total);
      
      // Mark cart as recovered (if it was abandoned)
      const email = shippingInfo.email || user?.email;
      if (email) {
        await ReminderSystem.markCartRecovered(email);
        await emailStorage.saveEmail(email, 'checkout', {
          cartValue: total,
          cartItems: items,
        });
        
        // Send post-purchase email
        await marketing.sendPostPurchaseEmail(email, {
          orderId,
          total,
          items: order.items,
          shippingInfo,
        });
      }
      
      // Clear cart
      await clearCart();
      
      setLoading(false);
      
      Alert.alert(
        "Order Confirmed!",
        `Your order has been placed successfully.\nOrder #${orderId}`,
        [
          { text: "View Orders", onPress: () => router.replace("/order-history" as any) },
          { text: "Continue Shopping", onPress: () => router.replace("/") },
        ]
      );
    } catch (error) {
      console.error("Error placing order:", error);
      setLoading(false);
      Alert.alert("Error", "Failed to place order. Please try again.");
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(" ").substr(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Progress Steps */}
          <View style={styles.progressContainer}>
            <View style={styles.progressStep}>
              <View style={[styles.progressCircle, step !== "shipping" && styles.progressCircleComplete]}>
                {step !== "shipping" ? <Check size={16} color="#fff" /> : <Text style={styles.progressNumber}>1</Text>}
              </View>
              <Text style={styles.progressLabel}>Shipping</Text>
            </View>
            <View style={[styles.progressLine, step !== "shipping" && styles.progressLineComplete]} />
            <View style={styles.progressStep}>
              <View style={[styles.progressCircle, step === "review" && styles.progressCircleComplete, step === "payment" && styles.progressCircleActive]}>
                {step === "review" ? <Check size={16} color="#fff" /> : <Text style={styles.progressNumber}>2</Text>}
              </View>
              <Text style={styles.progressLabel}>Payment</Text>
            </View>
            <View style={[styles.progressLine, step === "review" && styles.progressLineComplete]} />
            <View style={styles.progressStep}>
              <View style={[styles.progressCircle, step === "review" && styles.progressCircleActive]}>
                <Text style={styles.progressNumber}>3</Text>
              </View>
              <Text style={styles.progressLabel}>Review</Text>
            </View>
          </View>

          {/* Shipping Step */}
          {step === "shipping" && (
            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>SHIPPING INFORMATION</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={shippingInfo.fullName}
                onChangeText={(text) => setShippingInfo({...shippingInfo, fullName: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={shippingInfo.email}
                onChangeText={(text) => setShippingInfo({...shippingInfo, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={shippingInfo.phone}
                onChangeText={(text) => setShippingInfo({...shippingInfo, phone: text})}
                keyboardType="phone-pad"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Street Address"
                value={shippingInfo.address}
                onChangeText={(text) => setShippingInfo({...shippingInfo, address: text})}
              />
              
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="City"
                  value={shippingInfo.city}
                  onChangeText={(text) => setShippingInfo({...shippingInfo, city: text})}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="State"
                  value={shippingInfo.state}
                  onChangeText={(text) => setShippingInfo({...shippingInfo, state: text})}
                />
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="ZIP Code"
                value={shippingInfo.zipCode}
                onChangeText={(text) => setShippingInfo({...shippingInfo, zipCode: text})}
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Payment Step */}
          {step === "payment" && (
            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>PAYMENT INFORMATION</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Card Number"
                value={paymentInfo.cardNumber}
                onChangeText={(text) => setPaymentInfo({...paymentInfo, cardNumber: formatCardNumber(text)})}
                keyboardType="numeric"
                maxLength={19}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Cardholder Name"
                value={paymentInfo.cardHolder}
                onChangeText={(text) => setPaymentInfo({...paymentInfo, cardHolder: text})}
              />
              
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="MM/YY"
                  value={paymentInfo.expiryDate}
                  onChangeText={(text) => setPaymentInfo({...paymentInfo, expiryDate: formatExpiryDate(text)})}
                  keyboardType="numeric"
                  maxLength={5}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="CVV"
                  value={paymentInfo.cvv}
                  onChangeText={(text) => setPaymentInfo({...paymentInfo, cvv: text})}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>
          )}

          {/* Review Step */}
          {step === "review" && (
            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>ORDER REVIEW</Text>
              
              <View style={styles.reviewSection}>
                <View style={styles.reviewHeader}>
                  <MapPin size={16} color="#666" />
                  <Text style={styles.reviewTitle}>Shipping Address</Text>
                </View>
                <Text style={styles.reviewText}>{shippingInfo.fullName}</Text>
                <Text style={styles.reviewText}>{shippingInfo.address}</Text>
                <Text style={styles.reviewText}>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}</Text>
              </View>
              
              <View style={styles.reviewSection}>
                <View style={styles.reviewHeader}>
                  <CreditCard size={16} color="#666" />
                  <Text style={styles.reviewTitle}>Payment Method</Text>
                </View>
                <Text style={styles.reviewText}>•••• •••• •••• {paymentInfo.cardNumber.slice(-4)}</Text>
                <Text style={styles.reviewText}>{paymentInfo.cardHolder}</Text>
              </View>
              
              <View style={styles.reviewSection}>
                <Text style={styles.reviewTitle}>Order Items ({items.length})</Text>
                {items.map((item, index) => (
                  <View key={index} style={styles.item}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDetails}>Size: {item.size} | Qty: {item.quantity}</Text>
                    </View>
                    <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Shipping</Text>
                  <Text style={styles.summaryValue}>
                    {shipping === 0 ? "FREE" : `${shipping.toFixed(2)}`}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax</Text>
                  <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {step !== "shipping" && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setStep(step === "payment" ? "shipping" : "payment")}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.checkoutButton, loading && styles.disabledButton]} 
          onPress={step === "review" ? handlePlaceOrder : handleNextStep}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkoutButtonText}>
              {step === "review" ? "PLACE ORDER" : "CONTINUE"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  progressStep: {
    alignItems: "center",
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  progressCircleActive: {
    borderColor: "#000",
  },
  progressCircleComplete: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  progressLabel: {
    fontSize: 12,
    color: "#666",
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 8,
    marginBottom: 24,
  },
  progressLineComplete: {
    backgroundColor: "#000",
  },
  stepContent: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "300" as const,
    letterSpacing: 2,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  halfInput: {
    flex: 1,
  },
  reviewSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#333",
  },
  reviewText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500" as const,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: "#666",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  summary: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  bottomBar: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#000",
    paddingVertical: 16,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 1,
  },
  checkoutButton: {
    flex: 2,
    backgroundColor: "#000",
    paddingVertical: 18,
    alignItems: "center",
    borderRadius: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 2,
  },
});