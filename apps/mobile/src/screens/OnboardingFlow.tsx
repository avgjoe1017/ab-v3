import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import OnboardingGoalScreen from "./OnboardingGoalScreen";
import OnboardingVoiceScreen from "./OnboardingVoiceScreen";
import OnboardingBehaviorScreen from "./OnboardingBehaviorScreen";
import {
  saveOnboardingPreferences,
  skipOnboarding,
  type OnboardingGoal,
  type OnboardingVoice,
  type DefaultBehavior,
} from "../storage/onboarding";

interface OnboardingFlowProps {
  onComplete: () => void;
}

type OnboardingStep = "goal" | "voice" | "behavior";

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>("goal");
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);
  const [voice, setVoice] = useState<OnboardingVoice | null>(null);
  const queryClient = useQueryClient();

  const handleGoalNext = (selectedGoal: OnboardingGoal) => {
    setGoal(selectedGoal);
    setStep("voice");
  };

  const handleVoiceNext = (selectedVoice: OnboardingVoice) => {
    setVoice(selectedVoice);
    setStep("behavior");
  };

  const handleBehaviorComplete = async (behavior?: DefaultBehavior) => {
    await saveOnboardingPreferences({
      goal: goal || undefined,
      voice: voice || undefined,
      defaultBehavior: behavior,
    });
    queryClient.invalidateQueries({ queryKey: ["onboarding-preferences"] });
    onComplete();
  };

  const handleSkip = async () => {
    await skipOnboarding();
    queryClient.invalidateQueries({ queryKey: ["onboarding-preferences"] });
    onComplete();
  };

  return (
    <View style={{ flex: 1 }}>
      {step === "goal" && (
        <OnboardingGoalScreen onNext={handleGoalNext} onSkip={handleSkip} />
      )}
      {step === "voice" && (
        <OnboardingVoiceScreen onNext={handleVoiceNext} onSkip={handleSkip} selectedGoal={goal || undefined} />
      )}
      {step === "behavior" && (
        <OnboardingBehaviorScreen onComplete={handleBehaviorComplete} onSkip={handleSkip} />
      )}
    </View>
  );
}

