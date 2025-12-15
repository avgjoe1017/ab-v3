import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BottomSheet } from "./BottomSheet";
import { PrimaryButton } from "./PrimaryButton";
import { theme } from "../theme";

interface SaveMixPresetSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

/**
 * Bottom sheet for naming and saving a mix preset
 */
export const SaveMixPresetSheet: React.FC<SaveMixPresetSheetProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName("");
      onClose();
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} height={300}>
      <View style={styles.container}>
        <Text style={styles.title}>Save Mix Preset</Text>
        <Text style={styles.subtitle}>
          Give this mix a name so you can use it again later
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="e.g., Deep Focus, Sleep Mix"
          placeholderTextColor={theme.colors.text.tertiary}
          value={name}
          onChangeText={setName}
          autoFocus
          onSubmitEditing={handleSave}
        />

        <View style={styles.actions}>
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <PrimaryButton
            label="Save"
            onPress={handleSave}
            variant="gradient"
            size="md"
            disabled={!name.trim()}
          />
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.spacing[4],
  },
  title: {
    ...theme.typography.styles.h2,
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
  },
  subtitle: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  input: {
    ...theme.typography.styles.body,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    color: theme.colors.text.primary,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing[3],
    justifyContent: "flex-end",
  },
  cancelButton: {
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
  },
  cancelButtonText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
});

