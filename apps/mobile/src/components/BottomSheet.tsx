import React, { useEffect } from "react";
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { theme } from "../theme/tokens";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number | string; // number for pixels, string for percentage like "50%"
  snapPoints?: number[]; // Array of heights for snapping behavior
}

/**
 * BottomSheet - Modal bottom sheet component
 * Slides up from bottom, can be dismissed by tapping backdrop or swiping down
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  height = "50%",
  snapPoints,
}) => {
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  const sheetHeight =
    typeof height === "string" && height.includes("%")
      ? (SCREEN_HEIGHT * parseInt(height)) / 100
      : typeof height === "number"
      ? height
      : SCREEN_HEIGHT * 0.5;

  const handleBackdropPress = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: opacityAnim,
            },
          ]}
        />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={[styles.sheet, { height: sheetHeight }]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          {/* Content */}
          <View style={styles.content}>{children}</View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: theme.colors.background.secondary,
    borderTopLeftRadius: theme.radius["2xl"],
    borderTopRightRadius: theme.radius["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderBottomWidth: 0,
    ...theme.shadows.ios.xl,
    ...theme.shadows.android.xl,
  },
  handleContainer: {
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[2],
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.text.muted,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[6],
  },
});

