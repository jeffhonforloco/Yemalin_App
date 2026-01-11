import React from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import { router } from "expo-router";
import { Trash2, Plus, Minus } from "lucide-react-native";

export default function CartScreen() {
  const { items, removeFromCart, updateQuantity, getTotal, itemCount } = useCart();
  const { isAuthenticated, isLoading } = useAuth();
  const subtotal = getTotal();
  const shipping = subtotal > 150 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleCheckout = () => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated) {
      // Navigate to login - user can continue as guest or sign in
      router.push("/login");
      return;
    }
    router.push("/checkout");
  };

  const handleQuantityChange = async (id: string, size: string, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    if (newQty <= 0) {
      if (Platform.OS === 'web') {
        const shouldRemove = typeof globalThis.confirm === 'function'
          ? globalThis.confirm('Are you sure you want to remove this item from your cart?')
          : true;
        if (shouldRemove) {
          await removeFromCart(id, size);
        }
      } else {
        Alert.alert(
          'Remove Item',
          'Are you sure you want to remove this item from your cart?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', onPress: () => removeFromCart(id, size), style: 'destructive' },
          ]
        );
      }
    } else {
      await updateQuantity(id, size, newQty);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>YOUR BAG IS EMPTY</Text>
          <Text style={styles.emptyText}>
            Add items to your bag to continue shopping
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push("/shop")}
          >
            <Text style={styles.shopButtonText}>CONTINUE SHOPPING</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>SHOPPING BAG ({itemCount})</Text>
          <Text style={styles.helperText}>Tap Remove to delete an item or use − / + to change quantity.</Text>
        </View>

        <View style={styles.itemsContainer}>
          {items.map((item, index) => (
            <View key={`${item.id}-${item.size}-${index}`} style={styles.item}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleBlock}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {Boolean(item.description) && (
                      <Text numberOfLines={2} style={styles.itemDescription}>{item.description}</Text>
                    )}
                    <Text style={styles.itemSize}>Size: {item.size}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={async () => {
                      if (Platform.OS === 'web') {
                        const shouldDelete = typeof globalThis.confirm === 'function'
                          ? globalThis.confirm(`Remove ${item.name} (size ${item.size}) from your bag?`)
                          : true;
                        if (shouldDelete) {
                          await removeFromCart(item.id, item.size);
                        }
                      } else {
                        Alert.alert(
                          'Remove Item',
                          `Remove ${item.name} (size ${item.size}) from your bag?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Remove', onPress: () => removeFromCart(item.id, item.size), style: 'destructive' },
                          ]
                        );
                      }
                    }}
                    style={styles.removeButton}
                    testID={`remove-item-${item.id}-${item.size}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.name} size ${item.size} from cart`}
                  >
                    <Trash2 size={20} color="#999" />
                  </TouchableOpacity>
                </View>

                <View style={styles.itemFooter}>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(item.id, item.size, item.quantity, -1)}
                      activeOpacity={0.7}
                    >
                      <Minus size={16} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(item.id, item.size, item.quantity, 1)}
                      activeOpacity={0.7}
                    >
                      <Plus size={16} color="#000" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.itemPrice}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
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
              {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Tax</Text>
            <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.promoContainer}>
          <Text style={styles.promoText}>Have a promo code?</Text>
          <TouchableOpacity>
            <Text style={styles.promoLink}>Enter Code</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
          disabled={isLoading || items.length === 0}
          testID="proceed-to-checkout-button"
          accessibilityRole="button"
          accessibilityLabel="Proceed to checkout"
        >
          <Text style={styles.checkoutButtonText}>PROCEED TO CHECKOUT</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.back()}
          testID="continue-shopping-button"
          accessibilityRole="button"
          accessibilityLabel="Continue shopping"
        >
          <Text style={styles.continueButtonText}>Continue Shopping</Text>
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
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "300" as const,
    letterSpacing: 2,
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: "#777",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "300" as const,
    letterSpacing: 2,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: "#000",
    paddingHorizontal: 30,
    paddingVertical: 14,
  },
  shopButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 1,
  },
  itemsContainer: {
    padding: 20,
  },
  item: {
    flexDirection: "row",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  itemImage: {
    width: 100,
    height: 120,
    backgroundColor: "#f8f8f8",
    marginRight: 16,
    resizeMode: "cover",
    borderRadius: 4,
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500" as const,
    marginBottom: 4,
  },
  itemTitleBlock: {
    maxWidth: 260,
  },
  itemDescription: {
    fontSize: 12,
    color: "#777",
    lineHeight: 18,
    marginBottom: 6,
  },
  itemSize: {
    fontSize: 12,
    color: "#666",
  },
  removeButton: {
    padding: 8,
    alignSelf: "flex-start",
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    backgroundColor: "#fafafa",
  },
  quantityButton: {
    padding: 10,
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  quantity: {
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "500" as const,
    minWidth: 30,
    textAlign: "center",
  },
  itemPrice: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#000",
    letterSpacing: 0.3,
  },
  summary: {
    padding: 20,
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
  promoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  promoText: {
    fontSize: 14,
    color: "#666",
  },
  promoLink: {
    fontSize: 14,
    color: "#000",
    textDecorationLine: "underline",
  },
  bottomBar: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  checkoutButton: {
    backgroundColor: "#000",
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 12,
    borderRadius: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 2,
  },
  continueButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  continueButtonText: {
    fontSize: 14,
    color: "#666",
    textDecorationLine: "underline",
  },
});