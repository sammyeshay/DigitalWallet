import React from "react";
import { Pressable, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { homeStyles as styles } from "../../src/styles/homeStyles";

/**
 * Props for the QuickActionButton component.
 */
type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;

  /**
   * Optional visual variant for future flexibility.
   */
  variant?: "primary" | "secondary";
};

/**
 * QuickActionButton
 *
 * Updated to match the new Home screen design system:
 * - elevated, glass-style tile
 * - improved spacing and icon prominence
 * - subtle press feedback
 */
export default function QuickActionButton({
  icon,
  label,
  onPress,
  variant = "primary",
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        pressed && styles.actionButtonPressed,
      ]}
    >
      {/* Icon container */}
      <View
        style={[
          styles.actionIconWrap,
          variant === "secondary" && styles.actionIconWrapSecondary,
        ]}
      >
        <Ionicons name={icon} size={24} color="#FFFFFF" />
      </View>

      {/* Label */}
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}