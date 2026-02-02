import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform } from "react-native";
import { CartProvider } from "@/providers/CartProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { MarketingProvider } from "@/providers/MarketingProvider";
import { VIPProvider } from "@/providers/VIPProvider";
import Head from "expo-router/head";
import { trpc, trpcClient } from "@/lib/trpc";

if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync().catch((e) => {
    console.log("[splash] preventAutoHideAsync error", e);
  });
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <>
      {Platform.OS === 'web' && (
        <Head>
          <title>YÈMALÍN - Where Luxury Meets Scarcity | Ultra-Exclusive Fashion Drops</title>
          <meta name="description" content="YÈMALÍN - Ultra-exclusive luxury fashion brand creating genuine scarcity. Limited drops of 50-100 pieces worldwide that sell out in minutes. Join 3,247+ elite members for 48h early access to collections that define exclusivity." />
          <meta name="keywords" content="YÈMALÍN, ultra exclusive fashion, luxury scarcity, limited drops, sold out fashion, elite fashion, premium luxury clothing, exclusive access, waitlist fashion, luxury streetwear, high-end fashion, genuine scarcity, luxury brand, fashion drops, exclusive fashion" />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://www.yemalin.com/" />
          <meta property="og:title" content="YÈMALÍN - Where Luxury Meets Scarcity" />
          <meta property="og:description" content="Ultra-exclusive luxury fashion. Only 50-100 pieces per drop worldwide. Sold out in minutes. Join 3,247+ elite members for 48h early access." />
          <meta property="og:image" content="https://r2-pub.rork.com/generated-images/8b28e8a4-77d4-4e17-88ca-2409cad302a1.png" />
          <meta property="og:image:width" content="1024" />
          <meta property="og:image:height" content="1024" />
          <meta property="og:site_name" content="YÈMALÍN" />
          <meta property="og:locale" content="en_US" />
          
          {/* Twitter */}
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content="https://www.yemalin.com/" />
          <meta property="twitter:title" content="YÈMALÍN - Where Luxury Meets Scarcity" />
          <meta property="twitter:description" content="Ultra-exclusive luxury fashion. Only 50-100 pieces per drop worldwide. Sold out in minutes. Join elite circle for early access." />
          <meta property="twitter:image" content="https://r2-pub.rork.com/generated-images/8b28e8a4-77d4-4e17-88ca-2409cad302a1.png" />
          <meta property="twitter:creator" content="@yemalin_official" />
          <meta property="twitter:site" content="@yemalin_official" />
          
          {/* Additional SEO & AI Detection */}
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
          <meta name="author" content="YÈMALÍN" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
          <meta name="theme-color" content="#000000" />
          <meta name="msapplication-TileColor" content="#000000" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <link rel="canonical" href="https://www.yemalin.com/" />
          <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/icon.png" />
          <link rel="manifest" href="/manifest.json" />
          
          {/* Preconnect for performance */}
          <link rel="preconnect" href="https://images.unsplash.com" />
          <link rel="dns-prefetch" href="https://images.unsplash.com" />
          
          {/* Schema.org structured data for AI/SGE */}
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "YÈMALÍN",
              "alternateName": "YÈMALÍN Ultra-Exclusive Fashion",
              "url": "https://www.yemalin.com",
              "logo": {
                "@type": "ImageObject",
                "url": "https://r2-pub.rork.com/generated-images/8b28e8a4-77d4-4e17-88ca-2409cad302a1.png",
                "width": 1024,
                "height": 1024
              },
              "description": "Ultra-exclusive luxury fashion brand creating genuine scarcity through limited drops of 50-100 pieces worldwide. Collections consistently sell out in minutes, establishing true exclusivity in luxury fashion.",
              "foundingDate": "2024",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+1-555-YEMALIN",
                "contactType": "customer service",
                "email": "admin@yemalin.com",
                "availableLanguage": "English"
              },
              "sameAs": [
                "https://instagram.com/yemalin_official",
                "https://twitter.com/yemalin_official",
                "https://facebook.com/yemalin.official",
                "https://tiktok.com/@yemalin_official"
              ],
              "brand": {
                "@type": "Brand",
                "name": "YÈMALÍN",
                "description": "Where Luxury Meets Scarcity - Ultra-Exclusive Fashion Drops"
              },
              "makesOffer": {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Luxury Fashion Collection",
                  "category": "Clothing",
                  "brand": "YÈMALÍN"
                },
                "availability": "https://schema.org/LimitedAvailability",
                "priceRange": "$89-$189"
              }
            })}
          </script>
          
          {/* Product Schema for AI/SGE */}
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "YÈMALÍN Ultra-Exclusive Fashion Collection",
              "description": "Genuine scarcity luxury fashion - Only 50-100 pieces per drop worldwide, consistently sold out in minutes",
              "numberOfItems": 8,
              "itemListElement": [
                {
                  "@type": "Product",
                  "position": 1,
                  "name": "Essential Black Tee",
                  "brand": "YÈMALÍN",
                  "category": "T-Shirts",
                  "offers": {
                    "@type": "Offer",
                    "price": "89",
                    "priceCurrency": "USD",
                    "availability": "https://schema.org/LimitedAvailability",
                    "inventoryLevel": 7
                  }
                }
              ]
            })}
          </script>
          
          {/* FAQ Schema for AI/SGE */}
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What makes YÈMALÍN different from other luxury brands?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "YÈMALÍN creates genuine scarcity through ultra-limited drops of only 50-100 pieces worldwide. Unlike artificial scarcity, our collections consistently sell out in minutes due to exceptional craftsmanship and true exclusivity. We don't restock - once it's gone, it's gone forever."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How can I get early access to YÈMALÍN drops?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Join our elite circle of 3,247+ members for 48-hour exclusive early access, member-only pricing, and first notification of upcoming drops. Elite members have secured 89% of our limited pieces before public release."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Why do YÈMALÍN products sell out so quickly?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We create genuine scarcity by limiting each drop to 50-100 pieces globally. Our commitment to true exclusivity means no restocks, no mass production. When a piece sells out, it becomes part of fashion history. This authentic scarcity has created a cult following among luxury fashion collectors."
                  }
                }
              ]
            })}
          </script>
        </Head>
      )}
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="product/[id]" 
        options={{ 
          headerShown: false,
          presentation: "card"
        }} 
      />
      <Stack.Screen 
        name="size-guide" 
        options={{ 
          title: "Size Guide",
          presentation: "modal",
          headerStyle: {
            backgroundColor: "#000",
          },
          headerTintColor: "#fff",
        }} 
      />
      <Stack.Screen 
        name="checkout" 
        options={{ 
          title: "Checkout",
          headerStyle: {
            backgroundColor: "#000",
          },
          headerTintColor: "#fff",
        }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false, 
          presentation: "modal" 
        }} 
      />
      <Stack.Screen 
        name="cart" 
        options={{ 
          title: "Shopping Bag", 
          presentation: "modal" 
        }} 
      />
      <Stack.Screen 
        name="help-support" 
        options={{ 
          title: "Help & Support",
          presentation: "card"
        }} 
      />
      <Stack.Screen 
        name="waitlist" 
        options={{ 
          title: "Exclusive Waitlist",
          presentation: "card"
        }} 
      />
      <Stack.Screen 
        name="payment-methods" 
        options={{ 
          title: "Payment Methods",
          presentation: "card"
        }} 
      />
      <Stack.Screen 
        name="order-history" 
        options={{ 
          title: "Order History",
          presentation: "card"
        }} 
      />
      <Stack.Screen 
        name="admin" 
        options={{ 
          title: "Admin Dashboard",
          presentation: "card",
          headerShown: false,
        }} 
      />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== "web") {
      SplashScreen.hideAsync().catch((e) => {
        console.log("[splash] hideAsync error", e);
      });
    }
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <MarketingProvider>
            <AuthProvider>
              <VIPProvider>
                <CartProvider>
                  <RootLayoutNav />
                </CartProvider>
              </VIPProvider>
            </AuthProvider>
          </MarketingProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}