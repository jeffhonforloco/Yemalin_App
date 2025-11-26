import React, { useState, useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Filter, ShoppingBag } from "lucide-react-native";
import { products } from "@/data/products";
import { useCart } from "@/providers/CartProvider";

const { width } = Dimensions.get("window");

type FilterType = {
  color: string[];
  size: string[];
  availability: string;
};

export default function ShopScreen() {
  const { itemCount } = useCart();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterType>({
    color: [],
    size: [],
    availability: "all",
  });

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (filters.color.length > 0 && !filters.color.includes(product.color)) {
        return false;
      }
      if (filters.size.length > 0 && !product.sizes.some(s => filters.size.includes(s))) {
        return false;
      }
      if (filters.availability === "inStock" && product.stock === 0) {
        return false;
      }
      return true;
    });
  }, [filters]);

  const toggleColorFilter = (color: string) => {
    setFilters(prev => ({
      ...prev,
      color: prev.color.includes(color)
        ? prev.color.filter(c => c !== color)
        : [...prev.color, color],
    }));
  };

  const toggleSizeFilter = (size: string) => {
    setFilters(prev => ({
      ...prev,
      size: prev.size.includes(size)
        ? prev.size.filter(s => s !== size)
        : [...prev.size, size],
    }));
  };

  const clearFilters = () => {
    setFilters({
      color: [],
      size: [],
      availability: "all",
    });
  };

  const activeFiltersCount = filters.color.length + filters.size.length + 
    (filters.availability !== "all" ? 1 : 0);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color="#000" />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.title}>SHOP</Text>
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => router.push("/cart")}
        >
          <ShoppingBag size={20} color="#000" />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Promotional Banner */}
      <TouchableOpacity 
        style={styles.promoBanner}
        activeOpacity={0.95}
        onPress={() => {
          console.log('Sale banner clicked - showing all sale products');
        }}
      >
        <Text style={styles.promoText}>ED. SALE UP TO 70% OFF . MORE STYLES ADDED . SALE UP TO 70%</Text>
        <View style={styles.promoButton}>
          <Text style={styles.promoButtonText}>SHOP NOW</Text>
        </View>
      </TouchableOpacity>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>COLOR</Text>
            <View style={styles.filterOptions}>
              {["Black", "White"].map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.filterChip,
                    filters.color.includes(color) && styles.filterChipActive,
                  ]}
                  onPress={() => toggleColorFilter(color)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.color.includes(color) && styles.filterChipTextActive,
                    ]}
                  >
                    {color}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>SIZE</Text>
            <View style={styles.filterOptions}>
              {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.filterChip,
                    filters.size.includes(size) && styles.filterChipActive,
                  ]}
                  onPress={() => toggleSizeFilter(size)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.size.includes(size) && styles.filterChipTextActive,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>AVAILABILITY</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filters.availability === "all" && styles.filterChipActive,
                ]}
                onPress={() => setFilters(prev => ({ ...prev, availability: "all" }))}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.availability === "all" && styles.filterChipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  filters.availability === "inStock" && styles.filterChipActive,
                ]}
                onPress={() => setFilters(prev => ({ ...prev, availability: "inStock" }))}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.availability === "inStock" && styles.filterChipTextActive,
                  ]}
                >
                  In Stock
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeFiltersCount > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>CLEAR ALL</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* Products Grid */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>ALL COLLECTIONS</Text>
        </View>
        <View style={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => router.push(`/product/${product.id}`)}
              activeOpacity={0.9}
            >
              {product.stock <= 5 && product.stock > 0 && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW ARRIVAL</Text>
                </View>
              )}
              <Image source={{ uri: product.image }} style={styles.productImage} testID="shopProductImage" />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>${product.price} USD</Text>
                {product.stock <= 5 && product.stock > 0 && (
                  <Text style={styles.scarcityText}>Only {product.stock} left</Text>
                )}
                {product.stock === 0 && (
                  <Text style={styles.soldOutText}>SOLD OUT</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: 2,
    textTransform: "uppercase" as any,
  },
  promoBanner: {
    backgroundColor: "#000",
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  promoText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600" as const,
    letterSpacing: 1,
    textTransform: "uppercase" as any,
    textAlign: "center",
    marginBottom: 16,
  },
  promoButton: {
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "transparent",
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  promoButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 2,
    textTransform: "uppercase" as any,
  },
  sectionTitleContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#000",
    letterSpacing: 2,
    textTransform: "uppercase" as any,
  },
  filterButton: {
    position: "relative",
    padding: 8,
  },
  cartButton: {
    position: "relative",
    padding: 8,
  },
  cartBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#000",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600" as const,
  },
  filterBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#000",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold" as const,
  },
  filtersContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filterSection: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 1,
    marginBottom: 10,
    color: "#666",
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  filterChipText: {
    fontSize: 12,
    color: "#666",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  clearButton: {
    alignSelf: "flex-start",
    marginTop: 8,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 1,
    color: "#666",
    textDecorationLine: "underline",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    ...(Platform.OS === 'web' ? {
      gap: 20,
      maxWidth: 1200,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 20,
      justifyContent: 'flex-start',
    } : {
      gap: 0,
    }),
  },
  productCard: {
    marginBottom: 30,
    position: "relative",
    ...(Platform.OS === 'web' ? {
      width: '48%' as const,
      minWidth: 280,
      maxWidth: 400,
      margin: 0,
    } : {
      width: (width - 30) / 2,
      margin: 5,
    }),
  },
  newBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#000",
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 1,
  },
  newBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 1,
    textTransform: "uppercase" as any,
  },
  productImage: {
    width: "100%",
    backgroundColor: "#fff",
    marginBottom: 12,
    ...(Platform.OS === 'web' ? {
      aspectRatio: 3/4,
      objectFit: 'contain' as const,
      resizeMode: 'contain' as const,
    } : {
      height: 280,
      resizeMode: 'contain' as const,
    }),
  },
  productInfo: {
    gap: 6,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
    color: "#000",
    textTransform: "uppercase" as any,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#000",
  },
  scarcityText: {
    fontSize: 12,
    color: "#d32f2f",
    fontStyle: "italic",
  },
  soldOutText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600" as const,
  },
});