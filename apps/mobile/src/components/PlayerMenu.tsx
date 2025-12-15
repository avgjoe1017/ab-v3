import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BottomSheet } from "./BottomSheet";
import { theme } from "../theme";
import type { SleepTimerDuration } from "../hooks/useSleepTimer";

interface PlayerMenuProps {
  visible: boolean;
  onClose: () => void;
  sleepTimerDuration: SleepTimerDuration;
  onSetSleepTimer: (duration: SleepTimerDuration) => void;
  onRestart: () => void;
  onEndSession: () => void;
  onSOS?: () => void;
  onSaveMix?: () => void;
}

const SLEEP_TIMER_OPTIONS: Array<{ label: string; value: SleepTimerDuration }> = [
  { label: "5 minutes", value: 5 },
  { label: "10 minutes", value: 10 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "60 minutes", value: 60 },
  { label: "Off", value: null },
];

/**
 * PlayerMenu - Menu for Player screen actions
 * Includes sleep timer, restart session, and end session
 */
export const PlayerMenu: React.FC<PlayerMenuProps> = ({
  visible,
  onClose,
  sleepTimerDuration,
  onSetSleepTimer,
  onRestart,
  onEndSession,
  onSOS,
  onSaveMix,
}) => {
  return (
    <BottomSheet visible={visible} onClose={onClose} height={400}>
      <View style={styles.container}>
        {/* Sleep Timer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sleep Timer</Text>
          <View style={styles.options}>
            {SLEEP_TIMER_OPTIONS.map((option) => {
              const isSelected = sleepTimerDuration === option.value;
              return (
                <Pressable
                  key={option.value ?? "off"}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => {
                    onSetSleepTimer(option.value);
                    if (option.value === null) {
                      // Closing menu when turning off timer
                      onClose();
                    }
                  }}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <MaterialIcons name="check" size={20} color={theme.colors.accent.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          {onSaveMix && (
            <Pressable style={styles.action} onPress={() => { onSaveMix(); onClose(); }}>
              <MaterialIcons name="save" size={24} color={theme.colors.accent.primary} />
              <Text style={styles.actionText}>Save Mix Preset</Text>
            </Pressable>
          )}
          {onSOS && (
            <Pressable style={[styles.action, styles.actionSOS]} onPress={() => { onSOS(); onClose(); }}>
              <MaterialIcons name="emergency" size={24} color={theme.colors.semantic.error} />
              <Text style={[styles.actionText, styles.actionTextSOS]}>SOS Quick Help</Text>
            </Pressable>
          )}
          <Pressable style={styles.action} onPress={onRestart}>
            <MaterialIcons name="replay" size={24} color={theme.colors.text.primary} />
            <Text style={styles.actionText}>Restart Session</Text>
          </Pressable>
          <Pressable style={[styles.action, styles.actionDanger]} onPress={onEndSession}>
            <MaterialIcons name="stop" size={24} color={theme.colors.semantic.error} />
            <Text style={[styles.actionText, styles.actionTextDanger]}>End Session</Text>
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.spacing[6],
  },
  section: {
    gap: theme.spacing[4],
  },
  sectionTitle: {
    ...theme.typography.styles.h3,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  options: {
    gap: theme.spacing[2],
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing[4],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  optionSelected: {
    backgroundColor: theme.colors.background.surfaceElevated,
    borderColor: theme.colors.accent.primary,
  },
  optionText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  optionTextSelected: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    padding: theme.spacing[4],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  actionSOS: {
    borderColor: theme.colors.semantic.error,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  actionDanger: {
    borderColor: theme.colors.semantic.error,
  },
  actionText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
  },
  actionTextSOS: {
    color: theme.colors.semantic.error,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  actionTextDanger: {
    color: theme.colors.semantic.error,
  },
});

