/**
 * Review and Edit Step Component
 * Handles affirmation review, editing, deletion, and regeneration
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { PrimaryButton } from "../../components";
import { theme } from "../../theme";

interface ReviewEditStepProps {
  affirmations: string[];
  onAffirmationsChange: (affirmations: string[]) => void;
  onStart: () => void;
  startButtonLabel?: string;
  startButtonDisabled?: boolean;
  onDeletedIndicesChange?: (indices: Set<number>) => void;
}

export function ReviewEditStep({
  affirmations,
  onAffirmationsChange,
  onStart,
  startButtonLabel = "Start Session",
  startButtonDisabled = false,
  onDeletedIndicesChange,
}: ReviewEditStepProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [newAffirmationText, setNewAffirmationText] = useState("");
  const [deletedIndices, setDeletedIndices] = useState<Set<number>>(new Set());

  const handleEditAffirmation = (index: number) => {
    setEditingIndex(index);
    setEditText(affirmations[index] || "");
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editText.trim()) {
      const updated = [...affirmations];
      updated[editingIndex] = editText.trim();
      onAffirmationsChange(updated);
      setEditingIndex(null);
      setEditText("");
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditText("");
  };

  const handleDeleteAffirmation = (index: number) => {
    const newDeleted = new Set(deletedIndices);
    newDeleted.add(index);
    setDeletedIndices(newDeleted);
    onDeletedIndicesChange?.(newDeleted);
  };

  const handleKeepAffirmation = (index: number) => {
    const newDeleted = new Set(deletedIndices);
    newDeleted.delete(index);
    setDeletedIndices(newDeleted);
    onDeletedIndicesChange?.(newDeleted);
  };

  const handleDuplicateAffirmation = (index: number) => {
    const updated = [...affirmations];
    const toDuplicate = affirmations[index];
    if (toDuplicate) {
      updated.splice(index + 1, 0, toDuplicate);
      onAffirmationsChange(updated);
    }
  };

  const handleAddAffirmation = () => {
    if (newAffirmationText.trim()) {
      onAffirmationsChange([...affirmations, newAffirmationText.trim()]);
      setNewAffirmationText("");
    }
  };

  const handleStart = () => {
    // Filter out deleted affirmations before starting
    const keptAffirmations = affirmations.filter((_, i) => !deletedIndices.has(i));
    if (keptAffirmations.length === 0) {
      Alert.alert("No Affirmations", "Please keep at least one affirmation before continuing.");
      return;
    }
    onAffirmationsChange(keptAffirmations);
    const emptySet = new Set<number>();
    setDeletedIndices(emptySet);
    onDeletedIndicesChange?.(emptySet);
    onStart();
  };

  return (
    <>
      <Text style={styles.stepTitle}>Review + Edit</Text>
      
      <View style={styles.affirmationsList}>
        {affirmations.map((aff, i) => {
          const isDeleted = deletedIndices.has(i);
          const isEditing = editingIndex === i;
          
          return (
            <View
              key={i}
              style={[
                styles.affirmationCard,
                isDeleted && styles.affirmationCardDeleted,
                isEditing && styles.affirmationCardEditing,
              ]}
            >
              {isEditing ? (
                <>
                  <TextInput
                    style={styles.editInput}
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                    autoFocus
                    textAlignVertical="top"
                  />
                  <View style={styles.editActions}>
                    <Pressable onPress={handleSaveEdit} style={styles.editButton}>
                      <Text style={styles.editButtonText}>Save</Text>
                    </Pressable>
                    <Pressable onPress={handleCancelEdit} style={styles.editButton}>
                      <Text style={styles.editButtonText}>Cancel</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.affirmationText, isDeleted && styles.affirmationTextDeleted]}>
                    {i + 1}. {aff}
                  </Text>
                  <View style={styles.affirmationActions}>
                    <Pressable
                      onPress={() => handleEditAffirmation(i)}
                      style={styles.actionButton}
                    >
                      <MaterialIcons name="edit" size={18} color={theme.colors.accent.primary} />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDuplicateAffirmation(i)}
                      style={styles.actionButton}
                    >
                      <MaterialIcons name="content-copy" size={18} color={theme.colors.accent.primary} />
                      <Text style={styles.actionButtonText}>Duplicate</Text>
                    </Pressable>
                    {isDeleted ? (
                      <Pressable
                        onPress={() => handleKeepAffirmation(i)}
                        style={styles.actionButton}
                      >
                        <MaterialIcons name="undo" size={18} color={theme.colors.accent.secondary} />
                        <Text style={[styles.actionButtonText, { color: theme.colors.accent.secondary }]}>
                          Keep
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => handleDeleteAffirmation(i)}
                        style={styles.actionButton}
                      >
                        <MaterialIcons name="delete-outline" size={18} color={theme.colors.semantic.error} />
                        <Text style={[styles.actionButtonText, { color: theme.colors.semantic.error }]}>
                          Delete
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </>
              )}
            </View>
          );
        })}
      </View>

      {/* Add your own */}
      <View style={styles.addAffirmationSection}>
        <Text style={styles.label}>Add your own</Text>
        <View style={styles.addAffirmationRow}>
          <TextInput
            style={[styles.input, styles.addAffirmationInput]}
            value={newAffirmationText}
            onChangeText={setNewAffirmationText}
            placeholder="Type your affirmation..."
            multiline
            onSubmitEditing={handleAddAffirmation}
          />
          <Pressable onPress={handleAddAffirmation} style={styles.addButton}>
            <MaterialIcons name="add" size={24} color={theme.colors.accent.primary} />
          </Pressable>
        </View>
      </View>

      <PrimaryButton
        label={startButtonLabel}
        onPress={handleStart}
        style={styles.startButton}
        disabled={startButtonDisabled || affirmations.filter((_, i) => !deletedIndices.has(i)).length === 0}
      />
    </>
  );
}

const styles = StyleSheet.create({
  stepTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  affirmationsList: {
    gap: theme.spacing[3],
  },
  affirmationCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing[4],
  },
  affirmationCardDeleted: {
    opacity: 0.5,
    backgroundColor: theme.colors.background.tertiary,
  },
  affirmationCardEditing: {
    borderColor: theme.colors.accent.primary,
    borderWidth: 2,
  },
  affirmationText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  affirmationTextDeleted: {
    textDecorationLine: "line-through",
    color: theme.colors.text.muted,
  },
  affirmationActions: {
    flexDirection: "row",
    gap: theme.spacing[2],
    marginTop: theme.spacing[2],
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    padding: theme.spacing[1],
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
  },
  editInput: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    minHeight: 80,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  editActions: {
    flexDirection: "row",
    gap: theme.spacing[2],
    marginTop: theme.spacing[2],
  },
  editButton: {
    padding: theme.spacing[2],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent.primary,
  },
  editButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  addAffirmationSection: {
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  addAffirmationRow: {
    flexDirection: "row",
    gap: theme.spacing[2],
    alignItems: "flex-start",
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing[4],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    minHeight: 100,
  },
  addAffirmationInput: {
    flex: 1,
    minHeight: 60,
    marginBottom: 0,
  },
  addButton: {
    padding: theme.spacing[3],
    backgroundColor: theme.colors.accent.primary + "20",
    borderRadius: theme.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  startButton: {
    marginTop: theme.spacing[4],
  },
});

