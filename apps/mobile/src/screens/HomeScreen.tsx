import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Dimensions, Image, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { useDraftStore } from "../state/useDraftStore";
import { useEntitlement } from "../hooks/useEntitlement";
import { getAudioEngine } from "@ab/audio-engine";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type SessionRow = { id: string; title: string; durationSec: number; goalTag?: string };

export default function HomeScreen({ navigation }: any) {
  const { initializeDraft } = useDraftStore();
  const { entitlement, refreshEntitlement } = useEntitlement();
  const engine = useMemo(() => getAudioEngine(), []);
  const [snapshot, setSnapshot] = useState(() => engine.getState());

  useEffect(() => engine.subscribe((s) => setSnapshot(s)), [engine]);

  useEffect(() => {
    refreshEntitlement();
  }, [refreshEntitlement]);

  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await apiGet<{ sessions: SessionRow[] }>("/sessions");
      return res.sessions;
    },
  });

  const handleSessionPress = (sessionId: string) => {
    navigation.navigate("Player", { sessionId });
  };

  const isPlaying = snapshot.status === "playing" || snapshot.status === "preroll";
  const currentSession = isPlaying && snapshot.sessionId 
    ? sessions?.find(s => s.id === snapshot.sessionId)
    : null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0f172a", "#1e1b4b", "#2e1065"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerGreeting}>Good evening, Joe.</Text>
            <Text style={styles.headerSubtext}>Time to unwind</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>Day 12</Text>
            </View>
            <Pressable style={styles.profileButton}>
              <Image
                source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCcM5LX3ZRCLoBs7uKWs73U6i8ZY9BVU9W2BEfGjH1ORI0aQwgydzS0TcdFx7c8JSpUgdbbi_TIcRrLuSOgdxMTXCr0WxpYUyCy4MdmTxHB_JKM9C69r0voQrKA7NX2xSRO_wv6121eAePgvijseJz9BIUcqa3wgBRV1GCgJSB6hJkVEclHj-oasO0uASVxhDw-xNINxJnvAgMdQ0tb9Qet8uY4Omiq0CLmCRULHzyYedkfml553q8LwcFdoZZjrBceWumIT36ob5M" }}
                style={styles.profileImage}
              />
            </Pressable>
          </View>
        </View>

        {/* Hero Question */}
        <View style={styles.heroQuestionContainer}>
          <Text style={styles.heroQuestion}>What do you need to hear today?</Text>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCardContainer}>
          <ImageBackground
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBc_rvlXJ6YZr0J01q98iZEZ1hMnJj59Or6pOlk9ojJiwL4zhDjYJJ00TzzaI2dJ61mRLSU4ymrG8Y8AGJLVyQ47tUeRWLrqjjhC-bs_56gJ_KhHYZWOCFCNl6uK2zLyKa6GnG2rAHVa_RbMoJjCyTBivhqpuqlM8fo8t5ghjlU33ZiXjvMTU7UOi-5CHuCA624WJpgbmsYAr2i4YPJQg1mUwF0nvGF863UTNQgqDvQmkHJ1SXPeQCp3FLvKHNGmvnI-3q0oW-lpVw" }}
            style={styles.heroCardBackground}
            imageStyle={styles.heroCardImageStyle}
          >
            <LinearGradient
              colors={["transparent", "rgba(30, 27, 75, 0.6)", "#1e1b4b"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroCardContent}>
              <View style={styles.heroCardTop}>
                <View style={styles.heroCardBadge}>
                  <Text style={styles.heroCardBadgeText}>Based on values: Peace, Autonomy</Text>
                </View>
              </View>
              <View style={styles.heroCardInfo}>
                <Text style={styles.heroCardTitle}>Wind Down for Sleep</Text>
                <View style={styles.heroCardMeta}>
                  <MaterialIcons name="waves" size={18} color="rgba(196, 181, 253, 0.6)" />
                  <Text style={styles.heroCardMetaText}>Deep Rest · Delta 2Hz · 30 min</Text>
                </View>
              </View>
              <View style={styles.heroCardQuote}>
                <Text style={styles.heroCardQuoteText}>
                  "I release what I cannot control. My mind is quiet. My body is safe."
                </Text>
              </View>
              <View style={styles.heroCardActions}>
                <Pressable 
                  onPress={() => {
                    const firstSession = sessions?.[0];
                    if (firstSession) handleSessionPress(firstSession.id);
                  }}
                >
                  <LinearGradient
                    colors={["#6366f1", "#9333ea"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.beginButton}
                  >
                    <MaterialIcons name="play-arrow" size={24} color="#fff" />
                    <Text style={styles.beginButtonText}>BEGIN</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable style={styles.differentButton}>
                  <MaterialIcons name="cached" size={18} color="rgba(196, 181, 253, 0.6)" />
                  <Text style={styles.differentButtonText}>Hear a different affirmation</Text>
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Quick Access */}
        <View style={styles.quickAccessContainer}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickAccessScroll}
          >
            <Pressable style={styles.quickAccessCard}>
              <View style={styles.quickAccessCardTop}>
                <MaterialIcons name="self-improvement" size={24} color="#818cf8" />
              </View>
              <Text style={styles.quickAccessCardText}>Anxiety{'\n'}Relief</Text>
            </Pressable>
            <Pressable style={styles.quickAccessCard}>
              <View style={styles.quickAccessCardTop}>
                <MaterialIcons name="bolt" size={24} color="#818cf8" />
              </View>
              <Text style={styles.quickAccessCardText}>Focus{'\n'}Boost</Text>
            </Pressable>
            <Pressable style={styles.quickAccessCard}>
              <View style={styles.quickAccessCardTop}>
                <MaterialIcons name="bedtime" size={24} color="#818cf8" />
              </View>
              <Text style={styles.quickAccessCardText}>Deep{'\n'}Sleep</Text>
            </Pressable>
            <Pressable style={styles.quickAccessCard}>
              <View style={styles.quickAccessCardTop}>
                <MaterialIcons name="psychology" size={24} color="#818cf8" />
              </View>
              <Text style={styles.quickAccessCardText}>Creative{'\n'}Flow</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Continue Practice */}
        <View style={styles.continueContainer}>
          <Text style={styles.sectionTitle}>Continue Practice</Text>
          <Pressable style={styles.continueCard}>
            <View style={styles.continueImageContainer}>
              <ImageBackground
                source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOMlC_imRMWtXVZmY3ddngHqCJINdj0Gv1ZTBU6dxhEopDfmY_ojKpJQm2QoWGmC52SfBr3i1DoD9RiMsJeJLVIAL3Ea0E3qWmWYYWuPaAI9Yz72agSAAn1-qapgYYAMnC5OWJWGCg0OxvzKxto-No6A3ud84KABHop8QWrwRKfG0Nf4ObhPyrm--hMwEPme5eXPpywYKNrkooUTmC61-b0jpz6WyZaZnTabQR5QPW3RVFxU8SM88CGx70dFp8xRVYs_UGQi3AqVc" }}
                style={styles.continueImage}
              />
              <View style={styles.continuePlayOverlay}>
                <MaterialIcons name="play-arrow" size={24} color="#fff" />
              </View>
            </View>
            <View style={styles.continueInfo}>
              <View style={styles.continueInfoTop}>
                <Text style={styles.continueTitle}>Morning Clarity</Text>
                <Text style={styles.continueTime}>10m left</Text>
              </View>
              <View style={styles.continueProgressBar}>
                <View style={[styles.continueProgressFill, { width: "66%" }]} />
              </View>
            </View>
            <Pressable style={styles.continuePlayButton}>
              <MaterialIcons name="play-arrow" size={24} color="#fff" />
            </Pressable>
          </Pressable>
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Fixed Bottom Player Bar */}
      {currentSession && (
        <View style={styles.bottomPlayerBar}>
          <View style={styles.bottomPlayerContent}>
            <Image
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCbMfCencgoYvRwjY64_lGzxyriNLn3Bqsa2rKoTcHQYK_s9F6nlwpWOxHKJhFxLnwIJD5yHX88YpLApB3kCK1etwrlm6Oam0fg0zqf-NsKl2mPahhCDELvAyReh49kGRy3synUeYLMnc2aYbonSF3LP9-btBvs1631XTTYAd0BwfBMZ6bYduonL5UMFCzy995lS1N2M-aU4tWI7yy_pqv3LZOVwDT4t2IbJH3mSsake6ljEcAEan6HPQD2KPNxKTz_uLCs4oVmOsQ" }}
              style={styles.bottomPlayerImage}
            />
            <View style={styles.bottomPlayerText}>
              <Text style={styles.bottomPlayerTitle} numberOfLines={1}>
                {currentSession.title}
              </Text>
              <Text style={styles.bottomPlayerSubtitle} numberOfLines={1}>
                "I release what I cannot..."
              </Text>
            </View>
          </View>
          <View style={styles.bottomPlayerControls}>
            <View style={styles.audioVisualizer}>
              <View style={[styles.audioBar, { height: 12 }]} />
              <View style={[styles.audioBar, { height: 20 }]} />
              <View style={[styles.audioBar, { height: 16 }]} />
              <View style={[styles.audioBar, { height: 8 }]} />
            </View>
            <Pressable 
              style={styles.bottomPlayerPlayButton}
              onPress={() => {
                if (isPlaying) engine.pause();
                else engine.play();
              }}
            >
              <MaterialIcons name="pause-circle-filled" size={32} color="#fff" />
            </Pressable>
          </View>
        </View>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.bottomNavItem}>
          <View style={styles.bottomNavIconContainer}>
            <MaterialIcons name="calendar-today" size={24} color="#818cf8" />
            <View style={styles.bottomNavBadge} />
          </View>
          <Text style={styles.bottomNavLabelActive}>Today</Text>
        </Pressable>
        <Pressable 
          style={styles.bottomNavItem}
          onPress={() => navigation.navigate("Explore")}
        >
          <MaterialIcons name="explore" size={24} color="rgba(196, 181, 253, 0.5)" />
          <Text style={styles.bottomNavLabel}>Explore</Text>
        </Pressable>
        <Pressable style={styles.bottomNavItem}>
          <MaterialIcons name="bar-chart" size={24} color="rgba(196, 181, 253, 0.5)" />
          <Text style={styles.bottomNavLabel}>Progress</Text>
        </Pressable>
        <Pressable style={styles.bottomNavItem}>
          <MaterialIcons name="settings" size={24} color="rgba(196, 181, 253, 0.5)" />
          <Text style={styles.bottomNavLabel}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: "column",
  },
  headerGreeting: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
    letterSpacing: 0.5,
  },
  headerSubtext: {
    color: "rgba(196, 181, 253, 0.7)",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dayBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.2)",
  },
  dayBadgeText: {
    color: "rgba(196, 181, 253, 1)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  heroQuestionContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  heroQuestion: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: -0.5,
    lineHeight: 36,
    textAlign: "center",
    opacity: 0.9,
  },
  heroCardContainer: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  heroCardBackground: {
    width: "100%",
    aspectRatio: 4 / 5,
    maxHeight: 520,
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  heroCardImageStyle: {
    opacity: 0.5,
  },
  heroCardContent: {
    flex: 1,
    padding: 28,
    justifyContent: "space-between",
  },
  heroCardTop: {
    justifyContent: "flex-start",
    paddingTop: 8,
    marginBottom: "auto",
  },
  heroCardBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  heroCardBadgeText: {
    color: "rgba(196, 181, 253, 0.8)",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  heroCardInfo: {
    flexDirection: "column",
    gap: 8,
    marginBottom: 24,
  },
  heroCardTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "600",
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  heroCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroCardMetaText: {
    color: "rgba(196, 181, 253, 0.6)",
    fontSize: 14,
    fontWeight: "500",
  },
  heroCardQuote: {
    marginBottom: 32,
    paddingLeft: 0,
  },
  heroCardQuoteText: {
    color: "rgba(196, 181, 253, 0.95)",
    fontSize: 20,
    fontWeight: "500",
    fontStyle: "italic",
    lineHeight: 32,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  heroCardActions: {
    flexDirection: "column",
    gap: 16,
  },
  beginButton: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    height: 56,
    paddingHorizontal: 24,
  },
  beginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  differentButton: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 4,
  },
  differentButtonText: {
    color: "rgba(196, 181, 253, 0.6)",
    fontSize: 14,
    fontWeight: "500",
  },
  quickAccessContainer: {
    marginBottom: 40,
  },
  sectionTitle: {
    color: "rgba(196, 181, 253, 1)",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 28,
    letterSpacing: 0.5,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  quickAccessScroll: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  quickAccessCard: {
    width: 140,
    height: 100,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 24,
    padding: 16,
    flexDirection: "column",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  quickAccessCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  quickAccessCardText: {
    color: "rgba(196, 181, 253, 0.95)",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  continueContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  continueCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 32,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  continueImageContainer: {
    position: "relative",
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  continueImage: {
    width: "100%",
    height: "100%",
    opacity: 0.8,
  },
  continuePlayOverlay: {
    position: "absolute",
    inset: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  continueInfo: {
    flex: 1,
    minWidth: 0,
  },
  continueInfoTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  continueTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  continueTime: {
    color: "rgba(196, 181, 253, 0.7)",
    fontSize: 12,
    fontWeight: "500",
  },
  continueProgressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 9999,
    overflow: "hidden",
  },
  continueProgressFill: {
    height: "100%",
    backgroundColor: "transparent",
    borderRadius: 9999,
  },
  continuePlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomPlayerBar: {
    position: "absolute",
    bottom: 85,
    left: 16,
    right: 16,
    height: 64,
    backgroundColor: "rgba(30, 27, 75, 0.95)",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    marginBottom: 24,
  },
  bottomPlayerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
    flex: 1,
  },
  bottomPlayerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  bottomPlayerText: {
    flexDirection: "column",
    minWidth: 0,
    flex: 1,
  },
  bottomPlayerTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  bottomPlayerSubtitle: {
    color: "rgba(196, 181, 253, 0.6)",
    fontSize: 12,
  },
  bottomPlayerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  audioVisualizer: {
    height: 32,
    width: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  audioBar: {
    width: 4,
    backgroundColor: "#818cf8",
    borderRadius: 9999,
  },
  bottomPlayerPlayButton: {
    width: 40,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    paddingBottom: 24,
    paddingTop: 8,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomNavItem: {
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    width: 64,
  },
  bottomNavIconContainer: {
    position: "relative",
  },
  bottomNavBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    backgroundColor: "#818cf8",
    borderRadius: 4,
  },
  bottomNavLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(196, 181, 253, 0.5)",
  },
  bottomNavLabelActive: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
});
