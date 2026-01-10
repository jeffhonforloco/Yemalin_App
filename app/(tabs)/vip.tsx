import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock, Star, Gift, Zap, Crown, TrendingUp, Award, Users, Sparkles } from "lucide-react-native";
import { useAuth } from "@/providers/AuthProvider";
import { useVIP } from "@/providers/VIPProvider";
import { router } from "expo-router";
import { comingSoonProducts } from "@/data/products";

const { width } = Dimensions.get("window");

export default function VIPScreen() {
  const { user, isAuthenticated } = useAuth();
  const { isVIP, vipStats, vipOffers, currentTier, getVIPBenefits, isLoading } = useVIP();
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.lockedContainer}>
          <Lock size={60} color="#000" />
          <Text style={styles.lockedTitle}>SIGN IN REQUIRED</Text>
          <Text style={styles.lockedDescription}>
            Please sign in to view VIP benefits and check your status
          </Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.shopButtonText}>SIGN IN</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.lockedContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading VIP Status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isVIP) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.lockedContainer}>
          <Lock size={60} color="#000" />
          <Text style={styles.lockedTitle}>VIP ACCESS ONLY</Text>
          <Text style={styles.lockedDescription}>
            This exclusive area is reserved for our most valued customers.
            Spend $500+ to unlock VIP status and enjoy:
          </Text>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefit}>
              <Star size={20} color="#000" />
              <Text style={styles.benefitText}>Early access to new collections</Text>
            </View>
            <View style={styles.benefit}>
              <Gift size={20} color="#000" />
              <Text style={styles.benefitText}>Exclusive discounts up to 30%</Text>
            </View>
            <View style={styles.benefit}>
              <Zap size={20} color="#000" />
              <Text style={styles.benefitText}>Priority customer support</Text>
            </View>
            <View style={styles.benefit}>
              <Crown size={20} color="#000" />
              <Text style={styles.benefitText}>Personal stylist consultations</Text>
            </View>
            <View style={styles.benefit}>
              <Award size={20} color="#000" />
              <Text style={styles.benefitText}>Exclusive event invitations</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(user?.totalSpent || 0) / 500 * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              ${user?.totalSpent || 0} / $500 spent
            </Text>
            <Text style={styles.progressSubtext}>
              Spend ${500 - (user?.totalSpent || 0)} more to unlock VIP status
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => router.push("/")}
          >
            <Text style={styles.shopButtonText}>START SHOPPING</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const handleOfferPress = (offerId: string, code?: string) => {
    if (code) {
      setSelectedOffer(offerId);
      Alert.alert(
        "Offer Code",
        `Your exclusive code: ${code}\n\nThis code will be automatically applied at checkout.`,
        [{ text: "OK", onPress: () => setSelectedOffer(null) }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* VIP Header */}
        <View style={[styles.vipHeader, { backgroundColor: currentTier?.color + "20" || "#fafafa" }]}>
          <View style={[styles.tierBadge, { backgroundColor: currentTier?.color || "#FFD700" }]}>
            <Crown size={24} color="#fff" />
          </View>
          <Text style={styles.vipTitle}>{currentTier?.name.toUpperCase()} MEMBER</Text>
          <Text style={styles.vipSubtitle}>Exclusive {currentTier?.discountPercent}% discount on all items</Text>
          
          {vipStats?.nextTier && (
            <View style={styles.nextTierInfo}>
              <Text style={styles.nextTierText}>
                ${vipStats.nextTier.minSpent - (user?.totalSpent || 0)} away from {vipStats.nextTier.name}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${vipStats.progressToNextTier}%`,
                      backgroundColor: currentTier?.color || "#FFD700"
                    }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>

        {/* Exclusive Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VIP EARLY ACCESS</Text>
          <Text style={styles.sectionSubtitle}>Shop 48 hours before public release</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
            {comingSoonProducts.map((product) => (
              <TouchableOpacity 
                key={product.id} 
                style={styles.previewCard}
                onPress={() => router.push("/waitlist")}
              >
                <View style={styles.earlyAccessBadge}>
                  <Sparkles size={12} color="#fff" />
                  <Text style={styles.earlyAccessText}>EARLY ACCESS</Text>
                </View>
                <Image
                  source={{ uri: product.image }}
                  style={styles.previewImage}
                />
                <Text style={styles.previewText}>{product.name}</Text>
                <Text style={styles.previewPrice}>${product.price}</Text>
                {currentTier && (
                  <Text style={styles.vipPrice}>
                    VIP: ${Math.floor(product.price * (1 - currentTier.discountPercent / 100))}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* VIP Offers */}
        <View style={styles.offersSection}>
          <Text style={styles.sectionTitle}>YOUR VIP BENEFITS</Text>
          
          {vipOffers.map((offer) => (
            <TouchableOpacity 
              key={offer.id}
              style={[
                styles.offerCard,
                selectedOffer === offer.id && styles.selectedOfferCard
              ]}
              onPress={() => handleOfferPress(offer.id, offer.code)}
              activeOpacity={0.8}
            >
              <View style={styles.offerContent}>
                <View style={styles.offerHeader}>
                  <Text style={styles.offerTitle}>{offer.title}</Text>
                  {offer.isAutoApplied && (
                    <View style={styles.autoBadge}>
                      <Text style={styles.autoBadgeText}>AUTO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.offerDescription}>{offer.description}</Text>
                {offer.code && (
                  <Text style={styles.offerCode}>Tap to reveal code</Text>
                )}
                {offer.validUntil && (
                  <Text style={styles.offerExpiry}>Valid until {offer.validUntil}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* VIP Stats */}
        {vipStats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>YOUR VIP STATISTICS</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <TrendingUp size={20} color={currentTier?.color || "#000"} />
                <Text style={styles.statValue}>${vipStats.totalSpent}</Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
              <View style={styles.statCard}>
                <Gift size={20} color={currentTier?.color || "#000"} />
                <Text style={styles.statValue}>{vipStats.itemsPurchased}</Text>
                <Text style={styles.statLabel}>Items Purchased</Text>
              </View>
              <View style={styles.statCard}>
                <Star size={20} color={currentTier?.color || "#000"} />
                <Text style={styles.statValue}>${vipStats.totalSaved}</Text>
                <Text style={styles.statLabel}>Total Saved</Text>
              </View>
              <View style={styles.statCard}>
                <Crown size={20} color={currentTier?.color || "#000"} />
                <Text style={styles.statValue}>{currentTier?.name}</Text>
                <Text style={styles.statLabel}>Member Tier</Text>
              </View>
              <View style={styles.statCard}>
                <Users size={20} color={currentTier?.color || "#000"} />
                <Text style={styles.statValue}>{vipStats.referralCount}</Text>
                <Text style={styles.statLabel}>Referrals</Text>
              </View>
              <View style={styles.statCard}>
                <Award size={20} color={currentTier?.color || "#000"} />
                <Text style={styles.statValue}>{vipStats.exclusiveAccessCount}</Text>
                <Text style={styles.statLabel}>Exclusive Items</Text>
              </View>
            </View>
            
            {/* Member Since */}
            <View style={styles.memberSince}>
              <Text style={styles.memberSinceText}>
                VIP Member Since {new Date(vipStats.memberSince).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Text>
            </View>
          </View>
        )}

        {/* VIP Tiers Info */}
        <View style={styles.tiersSection}>
          <Text style={styles.sectionTitle}>VIP TIER BENEFITS</Text>
          <View style={styles.tiersList}>
            {getVIPBenefits().map((benefit, index) => (
              <View key={index} style={styles.tierBenefit}>
                <View style={[styles.tierBenefitDot, { backgroundColor: currentTier?.color || "#FFD700" }]} />
                <Text style={styles.tierBenefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
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
  lockedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: "300" as const,
    letterSpacing: 2,
    marginTop: 20,
    marginBottom: 16,
  },
  lockedDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#666",
  },
  progressSection: {
    width: "100%",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#000",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "500" as const,
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 12,
    color: "#666",
  },
  benefitsList: {
    width: "100%",
    marginBottom: 40,
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  benefitText: {
    fontSize: 14,
    color: "#333",
  },
  shopButton: {
    backgroundColor: "#000",
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  shopButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 1,
  },
  vipHeader: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  tierBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  vipTitle: {
    fontSize: 28,
    fontWeight: "300" as const,
    letterSpacing: 3,
    marginTop: 10,
  },
  vipSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  nextTierInfo: {
    marginTop: 20,
    width: "100%",
    paddingHorizontal: 20,
  },
  nextTierText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "300" as const,
    letterSpacing: 2,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  previewScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  previewCard: {
    marginRight: 15,
    position: "relative",
  },
  earlyAccessBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#000",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 1,
  },
  earlyAccessText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
  },
  previewImage: {
    width: 200,
    height: 250,
    backgroundColor: "#f5f5f5",
    marginBottom: 8,
    resizeMode: "cover",
    borderRadius: 4,
  },
  previewText: {
    fontSize: 12,
    fontWeight: "500" as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  previewPrice: {
    fontSize: 14,
    fontWeight: "600" as const,
    textDecorationLine: "line-through",
    color: "#999",
  },
  vipPrice: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#000",
  },
  offersSection: {
    padding: 20,
    backgroundColor: "#fafafa",
  },
  offerCard: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedOfferCard: {
    borderColor: "#000",
    borderWidth: 2,
  },
  offerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  autoBadge: {
    backgroundColor: "#000",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  autoBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
  },
  offerContent: {
    gap: 4,
  },
  offerTitle: {
    fontSize: 24,
    fontWeight: "600" as const,
    letterSpacing: 1,
  },
  offerDescription: {
    fontSize: 14,
    color: "#666",
  },
  offerCode: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#000",
    marginTop: 8,
    letterSpacing: 1,
  },
  offerExpiry: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
  statsSection: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: (width - 50) / 2,
    padding: 20,
    backgroundColor: "#fafafa",
    marginBottom: 10,
    alignItems: "center",
    gap: 8,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  memberSince: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    alignItems: "center",
  },
  memberSinceText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  tiersSection: {
    padding: 20,
    backgroundColor: "#fafafa",
  },
  tiersList: {
    marginTop: 16,
  },
  tierBenefit: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  tierBenefitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tierBenefitText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
});