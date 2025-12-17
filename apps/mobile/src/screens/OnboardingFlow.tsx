import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import OnboardingGoalScreen from "./OnboardingGoalScreen";
import ValuesEducationScreen from "./ValuesEducationScreen";
import ValueSelectionScreen, { type Value } from "./ValueSelectionScreen";
import ValueRankingScreen from "./ValueRankingScreen";
import OnboardingVoiceScreen from "./OnboardingVoiceScreen";
import OnboardingBehaviorScreen from "./OnboardingBehaviorScreen";
import {
  saveOnboardingPreferences,
  skipOnboarding,
  type OnboardingGoal,
  type OnboardingVoice,
  type DefaultBehavior,
} from "../storage/onboarding";
import { saveUserValues, saveUserStruggle } from "../lib/values";
import StruggleInputScreen from "./StruggleInputScreen";
import { useAuthToken } from "../lib/auth";

interface OnboardingFlowProps {
  onComplete: () => void;
}

type OnboardingStep = "goal" | "values-education" | "values-selection" | "values-ranking" | "struggle" | "voice" | "behavior";

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>("goal");
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);
  const [selectedValues, setSelectedValues] = useState<Value[]>([]);
  const [voice, setVoice] = useState<OnboardingVoice | null>(null);
  const queryClient = useQueryClient();
  const authToken = useAuthToken();

  const handleGoalNext = (selectedGoal: OnboardingGoal) => {
    setGoal(selectedGoal);
    setStep("values-education");
  };

  const handleValuesEducationNext = () => {
    setStep("values-selection");
  };

  const handleValuesSelectionNext = (values: Value[]) => {
    setSelectedValues(values);
    setStep("values-ranking");
  };

  const handleValuesRankingNext = async (rankedValues: Value[]) => {
    try {
      // Save values to API
      await saveUserValues(rankedValues, authToken);
      setSelectedValues(rankedValues);
      setStep("struggle");
    } catch (error) {
      console.error("[Onboarding] Failed to save values:", error);
      // Continue anyway - values are optional
      setStep("struggle");
    }
  };

  const handleStruggleNext = async (struggle?: string) => {
    try {
      // Save struggle to API
      await saveUserStruggle(struggle, authToken);
      setStep("voice");
    } catch (error) {
      console.error("[Onboarding] Failed to save struggle:", error);
      // Continue anyway - struggle is optional
      setStep("voice");
    }
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

  const handleValuesBack = () => {
    if (step === "values-ranking") {
      setStep("values-selection");
    } else if (step === "values-selection") {
      setStep("values-education");
    } else if (step === "values-education") {
      setStep("goal");
    }
  };

  const handleStruggleBack = () => {
    setStep("values-ranking");
  };

  return (
    <View style={{ flex: 1 }}>
      {step === "goal" && (
        <OnboardingGoalScreen onNext={handleGoalNext} onSkip={handleSkip} />
      )}
      {step === "values-education" && (
        <ValuesEducationScreen onNext={handleValuesEducationNext} onSkip={() => setStep("voice")} />
      )}
      {step === "values-selection" && (
        <ValueSelectionScreen onNext={handleValuesSelectionNext} onBack={handleValuesBack} />
      )}
      {step === "values-ranking" && (
        <ValueRankingScreen
          selectedValues={selectedValues}
          onNext={handleValuesRankingNext}
          onBack={handleValuesBack}
        />
      )}
      {step === "struggle" && (
        <StruggleInputScreen
          onNext={handleStruggleNext}
          onBack={handleStruggleBack}
          onSkip={() => setStep("voice")}
        />
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

