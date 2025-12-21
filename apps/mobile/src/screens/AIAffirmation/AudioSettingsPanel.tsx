/**
 * Audio Settings Panel Component
 * Handles voice, brain layer, background, and mix controls
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import Slider from "@react-native-community/slider";
import { theme } from "../../theme";
import type { AudioSettings, VoiceId, BrainLayerType } from "../../lib/affirmationPack";

interface AudioSettingsPanelProps {
  audioSettings: AudioSettings;
  onAudioSettingsChange: (settings: AudioSettings) => void;
}

export function AudioSettingsPanel({ audioSettings, onAudioSettingsChange }: AudioSettingsPanelProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>Audio Setup</Text>

      {/* Voice Picker */}
      <View style={styles.audioSubsection}>
        <Text style={styles.subLabel}>Voice</Text>
        <View style={styles.voiceOptions}>
          {(["nova", "shimmer", "alloy", "onyx"] as VoiceId[]).map((voiceId) => (
            <Pressable
              key={voiceId}
              style={[
                styles.voiceOption,
                audioSettings.voiceId === voiceId && styles.voiceOptionActive,
              ]}
              onPress={() =>
                onAudioSettingsChange({ ...audioSettings, voiceId })
              }
            >
              <Text
                style={[
                  styles.voiceOptionText,
                  audioSettings.voiceId === voiceId && styles.voiceOptionTextActive,
                ]}
              >
                {voiceId.charAt(0).toUpperCase() + voiceId.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Brain Layer */}
      <View style={styles.audioSubsection}>
        <Text style={styles.subLabel}>Brain Layer</Text>
        <View style={styles.brainLayerToggle}>
          {(["binaural", "solfeggio", "off"] as BrainLayerType[]).map((type) => (
            <Pressable
              key={type}
              style={[
                styles.brainLayerOption,
                audioSettings.brainLayerType === type && styles.brainLayerOptionActive,
              ]}
              onPress={() => {
                const newSettings = { ...audioSettings, brainLayerType: type };
                if (type === "binaural") {
                  newSettings.brainLayerPreset = "Calm";
                } else if (type === "solfeggio") {
                  newSettings.brainLayerPreset = "528";
                } else {
                  newSettings.brainLayerPreset = undefined;
                }
                onAudioSettingsChange(newSettings);
              }}
            >
              <Text
                style={[
                  styles.brainLayerOptionText,
                  audioSettings.brainLayerType === type && styles.brainLayerOptionTextActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Binaural Presets */}
        {audioSettings.brainLayerType === "binaural" && (
          <View style={styles.presetList}>
            {["Calm", "Focus", "Sleep", "Energy"].map((preset) => (
              <Pressable
                key={preset}
                style={[
                  styles.presetOption,
                  audioSettings.brainLayerPreset === preset && styles.presetOptionActive,
                ]}
                onPress={() =>
                  onAudioSettingsChange({ ...audioSettings, brainLayerPreset: preset })
                }
              >
                <Text
                  style={[
                    styles.presetOptionText,
                    audioSettings.brainLayerPreset === preset && styles.presetOptionTextActive,
                  ]}
                >
                  {preset}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Solfeggio Presets */}
        {audioSettings.brainLayerType === "solfeggio" && (
          <View style={styles.presetList}>
            {["396", "417", "528", "639", "741", "852"].map((preset) => (
              <Pressable
                key={preset}
                style={[
                  styles.presetOption,
                  audioSettings.brainLayerPreset === preset && styles.presetOptionActive,
                ]}
                onPress={() =>
                  onAudioSettingsChange({ ...audioSettings, brainLayerPreset: preset })
                }
              >
                <Text
                  style={[
                    styles.presetOptionText,
                    audioSettings.brainLayerPreset === preset && styles.presetOptionTextActive,
                  ]}
                >
                  {preset} Hz
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Background Picker */}
      <View style={styles.audioSubsection}>
        <Text style={styles.subLabel}>Background</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.backgroundScroll}>
          {[
            "Babbling Brook",
            "Forest Rain",
            "Heavy Rain",
            "Distant Ocean",
            "Birds Chirping",
            "Evening Walk",
            "Storm",
            "Thunder",
            "Tibetan Om",
            "Regeneration",
          ].map((bgId) => (
            <Pressable
              key={bgId}
              style={[
                styles.backgroundOption,
                audioSettings.backgroundId === bgId && styles.backgroundOptionActive,
              ]}
              onPress={() =>
                onAudioSettingsChange({ ...audioSettings, backgroundId: bgId })
              }
            >
              <Text
                style={[
                  styles.backgroundOptionText,
                  audioSettings.backgroundId === bgId && styles.backgroundOptionTextActive,
                ]}
              >
                {bgId}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Mix Sliders */}
      <View style={styles.audioSubsection}>
        <Text style={styles.subLabel}>Mix</Text>
        
        <View style={styles.mixSlider}>
          <Text style={styles.mixLabel}>Affirmations</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={audioSettings.mix.affirmations}
            onValueChange={(value) =>
              onAudioSettingsChange({
                ...audioSettings,
                mix: { ...audioSettings.mix, affirmations: value },
              })
            }
            minimumTrackTintColor={theme.colors.accent.primary}
            maximumTrackTintColor={theme.colors.border.subtle}
          />
          <Text style={styles.mixValue}>{Math.round(audioSettings.mix.affirmations * 100)}%</Text>
        </View>

        {audioSettings.brainLayerType !== "off" && (
          <View style={styles.mixSlider}>
            <Text style={styles.mixLabel}>
              {audioSettings.brainLayerType === "binaural" ? "Binaural" : "Solfeggio"}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={audioSettings.mix.binaural}
              onValueChange={(value) =>
                onAudioSettingsChange({
                  ...audioSettings,
                  mix: { ...audioSettings.mix, binaural: value },
                })
              }
              minimumTrackTintColor={theme.colors.accent.primary}
              maximumTrackTintColor={theme.colors.border.subtle}
            />
            <Text style={styles.mixValue}>{Math.round(audioSettings.mix.binaural * 100)}%</Text>
          </View>
        )}

        <View style={styles.mixSlider}>
          <Text style={styles.mixLabel}>Background</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={audioSettings.mix.background}
            onValueChange={(value) =>
              onAudioSettingsChange({
                ...audioSettings,
                mix: { ...audioSettings.mix, background: value },
              })
            }
            minimumTrackTintColor={theme.colors.accent.primary}
            maximumTrackTintColor={theme.colors.border.subtle}
          />
          <Text style={styles.mixValue}>{Math.round(audioSettings.mix.background * 100)}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: theme.spacing[6],
  },
  audioSubsection: {
    marginBottom: theme.spacing[4],
  },
  subLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  voiceOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[2],
  },
  voiceOption: {
    flex: 1,
    minWidth: "45%",
    padding: theme.spacing[3],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.background.secondary,
    alignItems: "center",
  },
  voiceOptionActive: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: theme.colors.accent.primary + "20",
  },
  voiceOptionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  voiceOptionTextActive: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  brainLayerToggle: {
    flexDirection: "row",
    gap: theme.spacing[2],
    marginBottom: theme.spacing[3],
  },
  brainLayerOption: {
    flex: 1,
    padding: theme.spacing[3],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.background.secondary,
    alignItems: "center",
  },
  brainLayerOptionActive: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: theme.colors.accent.primary + "20",
  },
  brainLayerOptionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  brainLayerOptionTextActive: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  presetList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[2],
  },
  presetOption: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.background.secondary,
  },
  presetOptionActive: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: theme.colors.accent.primary + "20",
  },
  presetOptionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  presetOptionTextActive: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  backgroundScroll: {
    marginTop: theme.spacing[2],
  },
  backgroundOption: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.background.secondary,
    marginRight: theme.spacing[2],
  },
  backgroundOptionActive: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: theme.colors.accent.primary + "20",
  },
  backgroundOptionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  backgroundOptionTextActive: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  mixSlider: {
    marginBottom: theme.spacing[4],
  },
  mixLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },
  slider: {
    width: "100%",
    height: 40,
  },
  mixValue: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    textAlign: "right",
    marginTop: theme.spacing[1],
  },
});

