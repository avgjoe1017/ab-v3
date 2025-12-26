import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../theme";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { useAuthToken } from "../lib/auth";

export interface CurationCard {
  slot: "next_step" | "right_now_1" | "right_now_2" | "tonight" | "your_best" | "try_new";
  title: string;
  duration: number;
  voiceId: string;
  brainLayerType: string;
  brainLayerPreset: string;
  backgroundId: string;
  whyText?: string;
  pathInfo?: {
    pathId: string;
    pathName: string;
    chapterIndex: number;
    totalChapters: number;
    nextAction?: string;
  };
}

interface ForYouSectionProps {
  onCardPress: (card: CurationCard) => void;
}

export function ForYouSection({ onCardPress }: ForYouSectionProps) {
  const authToken = useAuthToken();
  const [selectedCard, setSelectedCard] = useState<CurationCard | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["curation-cards"],
    queryFn: async () => {
      const res = await apiGet<{ cards: CurationCard[] }>("/me/curation", authToken);
      return res.cards;
    },
    enabled: !!authToken,
  });

  if (isLoading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>FOR YOU</Text>
        <Text style={styles.loadingText}>Loading your recommendations...</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionHeader}>FOR YOU</Text>
          <Text style={styles.subtitle}>Built from what you finish and what helps you settle.</Text>
        </View>
      </View>

      {data.map((card) => (
        <CurationCard
          key={card.slot}
          card={card}
          onPress={() => onCardPress(card)}
          onWhyPress={() => setSelectedCard(card)}
        />
      ))}

      <WhyModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </View>
  );
}

function CurationCard({
  card,
  onPress,
  onWhyPress,
}: {
  card: CurationCard;
  onPress: () => void;
  onWhyPress: () => void;
}) {
  const durationMin = Math.round(card.duration / 60);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        {card.slot === "next_step" && (
          <View style={styles.pathBadge}>
            <Text style={styles.pathBadgeText}>NEXT STEP</Text>
            {card.pathInfo && (
              <Text style={styles.pathProgress}>
                Chapter {card.pathInfo.chapterIndex} of {card.pathInfo.totalChapters}
              </Text>
            )}
          </View>
        )}
        {card.slot === "right_now_1" || card.slot === "right_now_2" ? (
          <Text style={styles.slotLabel}>RIGHT NOW</Text>
        ) : card.slot === "tonight" ? (
          <Text style={styles.slotLabel}>TONIGHT</Text>
        ) : card.slot === "your_best" ? (
          <Text style={styles.slotLabel}>YOUR BEST</Text>
        ) : card.slot === "try_new" ? (
          <Text style={styles.slotLabel}>TRY SOMETHING NEW</Text>
        ) : null}
      </View>

      <Text style={styles.cardTitle}>{card.title}</Text>

      <View style={styles.cardMeta}>
        <View style={styles.durationChip}>
          <Text style={styles.durationText}>{durationMin}</Text>
        </View>
        <View style={styles.audioChips}>
          <View style={styles.audioChip}>
            <Text style={styles.audioChipText}>Voice</Text>
          </View>
          <View style={styles.audioChip}>
            <Text style={styles.audioChipText}>Brain</Text>
          </View>
          <View style={styles.audioChip}>
            <Text style={styles.audioChipText}>Atmosphere</Text>
          </View>
        </View>
      </View>

      {card.pathInfo?.nextAction && (
        <Text style={styles.nextAction}>After this: {card.pathInfo.nextAction}</Text>
      )}

      <View style={styles.cardFooter}>
        <Pressable style={styles.startButton} onPress={onPress}>
          <Text style={styles.startButtonText}>START</Text>
        </Pressable>
        {card.whyText && (
          <Pressable style={styles.whyButton} onPress={onWhyPress}>
            <Text style={styles.whyButtonText}>Why this?</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

function WhyModal({ card, onClose }: { card: CurationCard | null; onClose: () => void }) {
  if (!card) return null;

  return (
    <Modal visible={!!card} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Why this?</Text>
            <Pressable onPress={onClose}>
              <MaterialIcons name="close" size={24} color={theme.colors.text.primary} />
            </Pressable>
          </View>
          <Text style={styles.modalText}>{card.whyText || "This session is recommended based on your usage patterns."}</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: theme.spacing[6],
    marginBottom: theme.spacing[6],
  },
  headerRow: {
    marginBottom: theme.spacing[4],
  },
  sectionHeader: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 11,
    color: theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: theme.spacing[1],
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[1],
  },
  loadingText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    color: theme.colors.text.secondary,
    paddingVertical: theme.spacing[4],
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[5],
    marginBottom: theme.spacing[4],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: theme.spacing[2],
  },
  slotLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 10,
    color: theme.colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pathBadge: {
    marginBottom: theme.spacing[1],
  },
  pathBadgeText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 10,
    color: theme.colors.accent.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pathProgress: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  cardTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 18,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    marginBottom: theme.spacing[3],
  },
  durationChip: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.full,
  },
  durationText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 12,
    color: theme.colors.text.primary,
  },
  audioChips: {
    flexDirection: "row",
    gap: theme.spacing[1],
  },
  audioChip: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.md,
  },
  audioChipText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  nextAction: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontStyle: "italic",
    marginBottom: theme.spacing[3],
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing[3],
  },
  startButton: {
    flex: 1,
    backgroundColor: theme.colors.accent.primary,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.radius.full,
    alignItems: "center",
  },
  startButtonText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  whyButton: {
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[3],
  },
  whyButtonText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing[6],
  },
  modalContent: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing[6],
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing[4],
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 18,
    color: theme.colors.text.primary,
  },
  modalText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});

