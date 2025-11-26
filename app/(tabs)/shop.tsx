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
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Filter, ShoppingBag, X, Star } from "lucide-react-native";
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

  const handleSaleBannerPress = () => {
    console.log('Shop Now pressed - navigating to sale items');
    setFilters({
      color: [],
      size: [],
      availability: "all",
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={22} color="#1a1a1a" strokeWidth={1.5} />
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
          <ShoppingBag size={22} color="#1a1a1a" strokeWidth={1.5} />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Promotional Banner */}
      <Pressable 
        style={styles.promoBanner}
        onPress={handleSaleBannerPress}
      >
        <LinearGradient
          colors={['#1a1a1a', '#000000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.promoBannerGradient}
        >
          <Text style={styles.promoText}>ED. SALE UP TO 70% OFF . MORE STYLES ADDED . SALE UP TO 70%</Text>
          <Pressable 
            style={({ pressed }) => [
              styles.promoButton,
              pressed && styles.promoButtonPressed
            ]}
            onPress={handleSaleBannerPress}
          >
            <Text style={styles.promoButtonText}>SHOP NOW</Text>
          </Pressable>
        </LinearGradient>
      </Pressable>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterHeaderTitle}>FILTER</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={20} color="#1a1a1a" strokeWidth={2} />
            </TouchableOpacity>
          </View>

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

          <View style={styles.filterActions}>
            {activeFiltersCount > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>CLEAR ALL</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>APPLY FILTERS</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Products Grid */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.sectionTitleContainer}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>ALL COLLECTIONS</Text>
            <View style={styles.productCount}>
              <Text style={styles.productCountText}>{filteredProducts.length} PIECES</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>Curated luxury essentials</Text>
        </View>
        <View style={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <Pressable
              key={product.id}
              style={({ pressed }) => [
                styles.productCard,
                pressed && styles.productCardPressed
              ]}
              onPress={() => router.push(`/product/${product.id}`)}
            >
              <View style={styles.imageContainer}>
                {product.stock <= 5 && product.stock > 0 && (
                  <View style={styles.newBadge}>
                    <Star size={10} color="#fff" fill="#fff" />
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
                {product.stock === 0 && (
                  <View style={styles.soldOutOverlay}>
                    <Text style={styles.soldOutOverlayText}>SOLD OUT</Text>
                  </View>
                )}
                <Image source={{ uri: product.image }} style={styles.productImage} testID="shopProductImage" />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.productPrice}>${product.price}</Text>
                  <Text style={styles.currencyText}>USD</Text>
                </View>
                {product.stock <= 5 && product.stock > 0 && (
                  <View style={styles.scarcityContainer}>
                    <View style={styles.scarcityDot} />
                    <Text style={styles.scarcityText}>Only {product.stock} left</Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  title: {
    fontSize: 24,
    fontWeight: "300" as const,
    letterSpacing: 6,
    textTransform: "uppercase" as any,
    color: "#1a1a1a",
  },
  promoBanner: {
    overflow: "hidden",
  },
  promoBannerGradient: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  promoText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500" as const,
    letterSpacing: 2,
    textTransform: "uppercase" as any,
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.95,
  },
  promoButton: {
    borderWidth: 1.5,
    borderColor: "#fff",
    backgroundColor: "transparent",
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  promoButtonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  promoButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500" as const,
    letterSpacing: 3,
    textTransform: "uppercase" as any,
  },
  sectionTitleContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    backgroundColor: "#fff",
    marginBottom: 1,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "300" as const,
    color: "#1a1a1a",
    letterSpacing: 4,
    textTransform: "uppercase" as any,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#888",
    letterSpacing: 1,
    fontWeight: "400" as const,
  },
  productCount: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#f5f5f5",
  },
  productCountText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500" as const,
    letterSpacing: 1,
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
    padding: 24,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  filterHeaderTitle: {
    fontSize: 18,
    fontWeight: "300" as const,
    letterSpacing: 4,
    color: "#1a1a1a",
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 11,
    fontWeight: "500" as const,
    letterSpacing: 2,
    marginBottom: 12,
    color: "#888",
    textTransform: "uppercase" as any,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    backgroundColor: "#fff",
  },
  filterChipActive: {
    backgroundColor: "#1a1a1a",
    borderColor: "#1a1a1a",
  },
  filterChipText: {
    fontSize: 12,
    color: "#1a1a1a",
    letterSpacing: 0.5,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 11,
    fontWeight: "500" as const,
    letterSpacing: 2,
    color: "#666",
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 11,
    fontWeight: "500" as const,
    letterSpacing: 2,
    color: "#fff",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    backgroundColor: "#fafafa",
    ...(Platform.OS === 'web' ? {
      gap: 16,
      maxWidth: 1200,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 24,
      justifyContent: 'flex-start',
    } : {
      gap: 0,
    }),
  },
  productCard: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 2,
    overflow: "hidden",
    ...(Platform.OS === 'web' ? {
      width: '48%' as const,
      minWidth: 280,
      maxWidth: 400,
      margin: 0,
    } : {
      width: (width - 36) / 2,
      margin: 6,
    }),
  },
  productCardPressed: {
    opacity: 0.95,
  },
  imageContainer: {
    position: "relative",
    backgroundColor: "#fff",
  },
  newBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  newBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "600" as const,
    letterSpacing: 1.5,
  },
  soldOutOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  soldOutOverlayText: {
    fontSize: 16,
    fontWeight: "500" as const,
    letterSpacing: 3,
    color: "#999",
  },
  productImage: {
    width: "100%",
    backgroundColor: "#fff",
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
    padding: 16,
    gap: 8,
  },
  productName: {
    fontSize: 13,
    fontWeight: "400" as const,
    letterSpacing: 1,
    color: "#1a1a1a",
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "300" as const,
    color: "#1a1a1a",
    letterSpacing: 0.5,
  },
  currencyText: {
    fontSize: 11,
    color: "#888",
    letterSpacing: 0.5,
  },
  scarcityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scarcityDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d32f2f",
  },
  scarcityText: {
    fontSize: 11,
    color: "#d32f2f",
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 40,
  },
});