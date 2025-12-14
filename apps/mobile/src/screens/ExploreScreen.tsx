import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Dimensions, Image, TextInput, ImageBackground } from "react-native";
// @ts-expect-error - expo-linear-gradient types may not be available immediately after install
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ExploreScreen({ navigation }: any) {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filters = ["All", "Sleep", "Focus", "Anxiety", "Relaxation"];

  const recommendedSessions = [
    { id: "1", title: "Lucid Dreaming", duration: "30 min", category: "Sleep", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA8yPHYCruhABE5oYlV1ytxHgTssXRbR5S2456W78kCIUIM7YfS8BO4jz0T6njQEflUjyw1WTZ70bmopy-6cNscj8oDsWYReKncbKuxt26OZGvvS-ItpO5Y4NYujzR1wrovu8l4JqExoUb0CR_X8fx4sM4csuoPIAgxozbHA_SSew4aJTSZLTKAfIueoB8ULbgMraTv7CfY1Kb-rwnP0eC3ROFfMYxSQmCE5zlZ0havIqCHbkXHhuS-PrDSTLlbk8DMY4AzNb8Y41E" },
    { id: "2", title: "Anxiety Release", duration: "15 min", category: "Healing", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCDKWGGoKMp_T7PRXRQNfS-d6Q7AtHN-0tMluyqg3V1yiPcnJVdC3OQEJiutYSYpZYaSeBhxpz3mYwKBdROgNC71-WzshT4gSbpkizh5279DWxN8bES0Qkg1yffIJuZPRu13r6xRKOCH0pPkoiC1aDcnhGbOQYhpO3y5wYD9_MCl1C-OHGGwign3FG-iT_1rrUmL-_nhASPlsYoXfxYze7CAsVqVgnvCvvSkgNVja4U6a_UrSY_NYpD-gAJb5Zx8j8rkZgGXg6GVQM" },
    { id: "3", title: "Deep Work", duration: "60 min", category: "Focus", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBFwzv0irj6uGhHK0mBqaU7ulcFttvCNXD4dk_oS9-b3P_jqyP2fqsZwmXZo8TlJawRpvxh2saxqhnsU9gu-MmtL6HE5ePLnD2tXdQWbmLxQR68HxCvp0kxWh6wNOC1MIawPR2ANZl3Amhpcqfouk8tqzgWyAb2rhEbLS62KhxUeCBlXpW9l3M6YwZUiMp_EFIiJbyGoHI3sqdCPG-c6CemtM2XpsDLQYnk-Xa5zxfzsUjeDjtcRDF61SGKmfsNpsdvRWNZ8JpXAQI" },
  ];

  const goalCards = [
    { id: "1", title: "Sleep Better", subtitle: "Delta waves", icon: "bedtime", color: "#3b82f6" },
    { id: "2", title: "Focus", subtitle: "Alpha waves", icon: "psychology", color: "#a855f7" },
    { id: "3", title: "Reduce Anxiety", subtitle: "Theta waves", icon: "self-improvement", color: "#14b8a6" },
    { id: "4", title: "Energy Boost", subtitle: "Gamma waves", icon: "bolt", color: "#f97316" },
  ];

  const newArrivals = [
    { id: "1", title: "Cosmic Drift", subtitle: "Relaxation • 25 min", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCeRvUAG3fkHSjtsbv9BSh0sDddkY39dB_xe1hCFHmDp5lGeOQ8GWdxtKvW4H1QGVSYaRygeYfHE3R7Jj2YGYTOHZ_9i7caIy2U4eo-WKGEF-zuWyIX4khVYifB46vFh61tlV_xMjbOAOSNNEQfK24EtXIaHqT3lMIGPyrMcFTgQDVoU-Rm5KxoCfJyFkKEjkXbNJymMqFiV3ZVBWyQSegGs_lq7-kizmDu-Z7OVuFLHLeyRa4Hgfkv_peH6KQIR2HOz__bTr3oV4k" },
    { id: "2", title: "Morning Alignment", subtitle: "Focus • 10 min", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAD8ugeknQ8j8w7GOM_nzDlJCSsKHvkGUKkOmZtqV1fcLaXiZzpO-g5b-mH9025tx7VAEDGxOrenhkBe_SaSUx8LSvET_XbiLEcXw6nGEdUMLUYAsaXKdBd3APxv3RqBBYIWVLYhVoBPRIIdkMd9vIRkeE4JjrySyu6DZjYXH7IbjZG7G-n2TVHmaL8CWHA_FQ5BIbZbZGnGjRrbH_Sc1P3tYV7exE0rcq6BjlvGz2eC_qsDK3s-ozhLugm2wJaAd--Nv0Xfm3qWTA" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Explore</Text>
            <Pressable style={styles.profileButton}>
              <MaterialIcons name="account-circle" size={28} color="#000" />
            </Pressable>
          </View>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search sessions, goals, or moods..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Tag Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {filters.map((filter) => (
            <Pressable
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterChipText,
                selectedFilter === filter && styles.filterChipTextActive
              ]}>
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Daily Pick */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Pick</Text>
          </View>
          <Pressable style={styles.dailyPickCard}>
            <ImageBackground
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQqSr_HJ3nAzF88zmaXlz06Ir36ZoNtTfa7mDH_CkL9FTRM9DUM5oyxvJsMNuPyunGaW6nGDPLtBINx22-VIjEUaPHimmslXwj8fQAZK-Ik0d3eBE7w8L2VBujIX_1QNuy9thsvoxDYNtXssTO7t_yNS4Hk0F1bfc7sjcF-JuDzwnKTS1FTintuA8rz_4cs98k9J2DItXujO90llSxwyHCobpn4Vrnw5-PR1V8U27p1u9sun8gK3pgE73JBMU3LhBP7JCAeIhoFUk" }}
              style={styles.dailyPickImage}
              imageStyle={styles.dailyPickImageStyle}
            >
              <LinearGradient
                colors={["rgba(0, 0, 0, 0.8)", "rgba(0, 0, 0, 0.2)", "transparent"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.dailyPickContent}>
                <View style={styles.dailyPickBadges}>
                  <View style={styles.dailyPickBadgePrimary}>
                    <Text style={styles.dailyPickBadgeText}>Deep Focus</Text>
                  </View>
                  <View style={styles.dailyPickBadgeSecondary}>
                    <MaterialIcons name="schedule" size={14} color="#fff" />
                    <Text style={styles.dailyPickBadgeText}>45 min</Text>
                  </View>
                </View>
                <Text style={styles.dailyPickTitle}>Theta Waves for Clarity</Text>
                <Text style={styles.dailyPickDescription} numberOfLines={2}>
                  Enhanced concentration through low-frequency binaural beats. Perfect for studying or deep work.
                </Text>
                <Pressable style={styles.dailyPickButton}>
                  <MaterialIcons name="play-arrow" size={20} color="#fff" />
                  <Text style={styles.dailyPickButtonText}>Play Session</Text>
                </Pressable>
              </View>
            </ImageBackground>
          </Pressable>
        </View>

        {/* Recommended for You */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            <Pressable>
              <Text style={styles.seeAllLink}>See All</Text>
            </Pressable>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendedScroll}
          >
            {recommendedSessions.map((session) => (
              <Pressable key={session.id} style={styles.recommendedCard}>
                <View style={styles.recommendedImageContainer}>
                  <ImageBackground
                    source={{ uri: session.image }}
                    style={styles.recommendedImage}
                    imageStyle={styles.recommendedImageStyle}
                  >
                    <View style={styles.recommendedOverlay} />
                    <View style={styles.recommendedPlayOverlay}>
                      <View style={styles.recommendedPlayButton}>
                        <MaterialIcons name="play-arrow" size={24} color="#fff" />
                      </View>
                    </View>
                  </ImageBackground>
                </View>
                <View style={styles.recommendedInfo}>
                  <Text style={styles.recommendedTitle}>{session.title}</Text>
                  <Text style={styles.recommendedSubtitle}>{session.duration} • {session.category}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Browse by Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Goal</Text>
          <View style={styles.goalsGrid}>
            {goalCards.map((goal) => (
              <Pressable key={goal.id} style={styles.goalCard}>
                <View style={[styles.goalIconContainer, { backgroundColor: `${goal.color}1A` }]}>
                  <MaterialIcons name={goal.icon as any} size={24} color={goal.color} />
                </View>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalSubtitle}>{goal.subtitle}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* New Arrivals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New Arrivals</Text>
          </View>
          <View style={styles.newArrivalsList}>
            {newArrivals.map((item) => (
              <Pressable key={item.id} style={styles.newArrivalItem}>
                <View style={styles.newArrivalImageContainer}>
                  <ImageBackground
                    source={{ uri: item.image }}
                    style={styles.newArrivalImage}
                  >
                    <View style={styles.newArrivalPlayOverlay}>
                      <MaterialIcons name="play-arrow" size={16} color="#fff" />
                    </View>
                  </ImageBackground>
                </View>
                <View style={styles.newArrivalInfo}>
                  <Text style={styles.newArrivalTitle}>{item.title}</Text>
                  <Text style={styles.newArrivalSubtitle}>{item.subtitle}</Text>
                </View>
                <Pressable style={styles.newArrivalAddButton}>
                  <MaterialIcons name="add" size={18} color="#9ca3af" />
                </Pressable>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Pressable 
          style={styles.bottomNavItem}
          onPress={() => navigation.navigate("Home")}
        >
          <MaterialIcons name="home" size={26} color="#9ca3af" />
          <Text style={styles.bottomNavLabel}>Home</Text>
        </Pressable>
        <Pressable style={styles.bottomNavItem}>
          <MaterialIcons name="explore" size={26} color="#e619e5" />
          <Text style={[styles.bottomNavLabel, styles.bottomNavLabelActive]}>Explore</Text>
        </Pressable>
        <View style={styles.bottomNavCenter}>
          <Pressable style={styles.bottomNavCenterButton}>
            <MaterialIcons name="play-arrow" size={32} color="#fff" />
          </Pressable>
        </View>
        <Pressable style={styles.bottomNavItem}>
          <MaterialIcons name="bar-chart" size={26} color="#9ca3af" />
          <Text style={styles.bottomNavLabel}>Stats</Text>
        </Pressable>
        <Pressable style={styles.bottomNavItem}>
          <MaterialIcons name="person" size={26} color="#9ca3af" />
          <Text style={styles.bottomNavLabel}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f6f8",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: "column",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: "rgba(248, 246, 248, 0.8)",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: "#000",
  },
  profileButton: {
    width: 40,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    position: "relative",
    width: "100%",
  },
  searchIcon: {
    position: "absolute",
    left: 16,
    top: 14,
    zIndex: 1,
  },
  searchInput: {
    width: "100%",
    padding: 14,
    paddingLeft: 44,
    fontSize: 14,
    color: "#000",
    backgroundColor: "#fff",
    borderRadius: 9999,
    borderWidth: 0,
  },
  filtersContainer: {
    paddingHorizontal: 24,
    paddingRight: 8,
    paddingBottom: 8,
    gap: 12,
  },
  filterChip: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    borderRadius: 9999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  filterChipActive: {
    backgroundColor: "#e619e5",
    borderColor: "#e619e5",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: "500",
    color: "#e619e5",
  },
  dailyPickCard: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: "hidden",
  },
  dailyPickImage: {
    width: "100%",
    height: "100%",
  },
  dailyPickImageStyle: {
    resizeMode: "cover",
  },
  dailyPickContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    zIndex: 20,
  },
  dailyPickBadges: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  dailyPickBadgePrimary: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#e619e5",
    borderRadius: 6,
  },
  dailyPickBadgeSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 6,
  },
  dailyPickBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dailyPickTitle: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 28,
    color: "#fff",
    marginBottom: 8,
  },
  dailyPickDescription: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  dailyPickButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  dailyPickButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  recommendedScroll: {
    paddingRight: 24,
    gap: 16,
  },
  recommendedCard: {
    width: 160,
    flexDirection: "column",
    gap: 8,
  },
  recommendedImageContainer: {
    width: 160,
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#2d1b2d",
  },
  recommendedImage: {
    width: "100%",
    height: "100%",
  },
  recommendedImageStyle: {
    resizeMode: "cover",
  },
  recommendedOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  recommendedPlayOverlay: {
    position: "absolute",
    inset: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
  },
  recommendedPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e619e5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  recommendedInfo: {
    flexDirection: "column",
    gap: 4,
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    lineHeight: 22,
  },
  recommendedSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  goalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 16,
  },
  goalCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    flexDirection: "column",
    gap: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  goalIconContainer: {
    height: 40,
    width: 40,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  goalInfo: {
    flexDirection: "column",
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  goalSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  newArrivalsList: {
    flexDirection: "column",
    gap: 12,
    marginTop: 12,
  },
  newArrivalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 8,
    paddingRight: 16,
    borderRadius: 12,
  },
  newArrivalImageContainer: {
    height: 56,
    width: 56,
    borderRadius: 8,
    overflow: "hidden",
  },
  newArrivalImage: {
    width: "100%",
    height: "100%",
  },
  newArrivalPlayOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
  },
  newArrivalInfo: {
    flex: 1,
    minWidth: 0,
  },
  newArrivalTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  newArrivalSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  newArrivalAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
  bottomNavItem: {
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    width: 64,
  },
  bottomNavCenter: {
    position: "relative",
    top: -20,
  },
  bottomNavCenterButton: {
    height: 56,
    width: 56,
    borderRadius: 28,
    backgroundColor: "#e619e5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNavLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#9ca3af",
  },
  bottomNavLabelActive: {
    color: "#e619e5",
  },
});
