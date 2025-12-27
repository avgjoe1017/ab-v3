/**
 * Chat Composer Screen
 * LLM-style UI shell for session creation
 * 
 * Shows a chat transcript (user + assistant), suggested choices (chips),
 * and triggers generation, editing, and session creation.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { randomUUID } from "expo-crypto";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HamburgerButton } from "../components";
import { theme } from "../theme";
import { useSessionComposer } from "../hooks/useSessionComposer";
import { MessageBubble } from "./ChatComposer/components/MessageBubble";
import { ChoiceChips } from "./ChatComposer/components/ChoiceChips";
import { ComposerInputBar } from "./ChatComposer/components/ComposerInputBar";
import { ReviewEditStep } from "./AIAffirmation/ReviewEditStep";
import { AudioSettingsPanel } from "./AIAffirmation/AudioSettingsPanel";
import type { ChatMessage, ChipAction } from "./ChatComposer/types";
import {
  GOAL_PRESETS,
  LENGTH_OPTIONS,
  SESSION_READY_ACTIONS,
  OPENER_MESSAGE,
  GENERATING_MESSAGE,
  READY_MESSAGE,
} from "./ChatComposer/constants";

interface ChatComposerScreenProps {
  navigation: any;
}

export default function ChatComposerScreen({ navigation }: ChatComposerScreenProps) {
  const composer = useSessionComposer();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: randomUUID(),
      role: "assistant",
      kind: "text",
      text: OPENER_MESSAGE,
    },
  ]);
  
  // Input state
  const [inputValue, setInputValue] = useState("");
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  
  // Track if we've shown the ready state
  const [hasShownReady, setHasShownReady] = useState(false);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Message helpers
  // ─────────────────────────────────────────────────────────────────────────────
  
  const addMessage = useCallback((message: Omit<ChatMessage, "id">) => {
    setMessages((prev) => [...prev, { ...message, id: randomUUID() }]);
    // Scroll to bottom after adding message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);
  
  const removeLastMessage = useCallback(() => {
    setMessages((prev) => prev.slice(0, -1));
  }, []);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Handle user sending a goal
  // ─────────────────────────────────────────────────────────────────────────────
  
  const handleSend = useCallback(async () => {
    const goal = inputValue.trim();
    if (!goal || goal.length < 2) return;
    
    // Add user message
    addMessage({ role: "user", kind: "text", text: goal });
    setInputValue("");
    
    // Set goal in composer
    composer.setGoal(goal);
    
    // Add loading message
    addMessage({ role: "assistant", kind: "loading", text: GENERATING_MESSAGE });
    
    // Generate
    await composer.generate();
  }, [inputValue, composer, addMessage]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Handle chip presses
  // ─────────────────────────────────────────────────────────────────────────────
  
  const handleChipPress = useCallback(async (chip: ChipAction) => {
    switch (chip.kind) {
      case "presetGoal":
        if (typeof chip.payload === "string") {
          setInputValue(chip.payload);
        }
        break;
        
      case "setLength":
        if (typeof chip.payload === "number") {
          composer.setLength(chip.payload as 6 | 12 | 18 | 24);
        }
        break;
        
      case "generate":
        await handleSend();
        break;
        
      case "edit":
        setShowEditModal(true);
        break;
        
      case "audio":
        setShowAudioModal(true);
        break;
        
      case "start":
        handleStartSession();
        break;
        
      case "setVoice":
        if (typeof chip.payload === "string" && composer.pack) {
          composer.setAudioSettings({ voiceId: chip.payload as any });
        }
        break;
        
      case "setBackground":
        if (typeof chip.payload === "string" && composer.pack) {
          composer.setAudioSettings({ backgroundId: chip.payload });
        }
        break;
        
      case "setBrainLayer":
        if (typeof chip.payload === "string" && composer.pack) {
          composer.setAudioSettings({ brainLayerType: chip.payload as any });
        }
        break;
    }
  }, [composer, handleSend]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Handle session creation
  // ─────────────────────────────────────────────────────────────────────────────
  
  const handleStartSession = useCallback(async () => {
    const result = await composer.createSession();
    if (result?.sessionId) {
      navigation.navigate("Player", { sessionId: result.sessionId });
    } else if (composer.error) {
      Alert.alert("Error", composer.error);
    }
  }, [composer, navigation]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Watch composer phase and update messages
  // ─────────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    if (composer.phase === "ready" && composer.pack && !hasShownReady) {
      // Remove loading message
      removeLastMessage();
      
      // Add ready message with preview
      const preview = composer.pack.affirmations.slice(0, 4);
      addMessage({
        role: "assistant",
        kind: "text",
        text: `${READY_MESSAGE}\n\n${preview.map((a, i) => `${i + 1}. ${a}`).join("\n")}${composer.pack.affirmations.length > 4 ? `\n\n+ ${composer.pack.affirmations.length - 4} more` : ""}`,
      });
      
      setHasShownReady(true);
    }
    
    if (composer.phase === "error" && composer.error) {
      removeLastMessage();
      addMessage({
        role: "assistant",
        kind: "text",
        text: `Sorry, something went wrong: ${composer.error}\n\nLet's try again!`,
      });
    }
  }, [composer.phase, composer.pack, composer.error, hasShownReady, addMessage, removeLastMessage]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Reset state when navigating away and back
  // ─────────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Reset if we're coming back after creating a session
      if (composer.phase === "creating") {
        composer.reset();
        setMessages([
          {
            id: randomUUID(),
            role: "assistant",
            kind: "text",
            text: OPENER_MESSAGE,
          },
        ]);
        setHasShownReady(false);
      }
    });
    
    return unsubscribe;
  }, [navigation, composer]);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  
  const isGenerating = composer.phase === "generating";
  const isReady = composer.phase === "ready" && composer.pack;
  const isCreating = composer.phase === "creating";
  
  const insets = useSafeAreaInsets();
  
  return (
    <View style={styles.screenContainer}>
      {/* Header with Hamburger */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <HamburgerButton />
        <Text style={styles.headerTitle}>Compose</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role}
            kind={message.kind}
            text={message.text}
          />
        ))}
        
        {/* Show goal presets if idle and no messages sent yet */}
        {composer.phase === "idle" && messages.length === 1 && (
          <View style={styles.presetsContainer}>
            <ChoiceChips chips={GOAL_PRESETS} onChipPress={handleChipPress} />
          </View>
        )}
        
        {/* Show length options after goal is set but before generating */}
        {composer.phase === "idle" && composer.goal && (
          <View style={styles.optionsContainer}>
            <ChoiceChips
              chips={LENGTH_OPTIONS}
              onChipPress={handleChipPress}
              selectedId={`length-${composer.length}`}
            />
          </View>
        )}
        
        {/* Show action buttons when ready */}
        {isReady && (
          <View style={styles.actionsContainer}>
            <ChoiceChips chips={SESSION_READY_ACTIONS} onChipPress={handleChipPress} />
          </View>
        )}
      </ScrollView>
      
      {/* Input Bar */}
      <ComposerInputBar
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        disabled={isGenerating || isCreating}
        placeholder={isReady ? "Start a new conversation..." : "Message..."}
      />
      
      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Affirmations</Text>
            <Pressable onPress={() => setShowEditModal(false)} style={styles.modalCloseButton}>
              <MaterialIcons name="close" size={24} color={theme.colors.text.primary} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent}>
            {composer.pack && (
              <ReviewEditStep
                affirmations={composer.pack.affirmations}
                onAffirmationsChange={composer.updateAffirmations}
                onStart={() => {
                  setShowEditModal(false);
                  handleStartSession();
                }}
                startButtonLabel="Save & Start"
              />
            )}
          </ScrollView>
        </View>
      </Modal>
      
      {/* Audio Settings Modal */}
      <Modal
        visible={showAudioModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAudioModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Audio Settings</Text>
            <Pressable onPress={() => setShowAudioModal(false)} style={styles.modalCloseButton}>
              <MaterialIcons name="close" size={24} color={theme.colors.text.primary} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent}>
            {composer.pack && (
              <AudioSettingsPanel
                audioSettings={composer.pack.audioSettings}
                onAudioSettingsChange={(settings) => composer.setAudioSettings(settings)}
              />
            )}
            <Pressable
              style={styles.audioSaveButton}
              onPress={() => setShowAudioModal(false)}
            >
              <Text style={styles.audioSaveButtonText}>Done</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40, // Match hamburger button width
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  presetsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: "flex-start",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  audioSaveButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  audioSaveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

