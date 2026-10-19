import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { uiSystem as styles } from "../../src/styles/uiSystem";

type EmptyStateProps = {
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColour?: string;
  title: string;
  body: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export default function EmptyState({
  loading = false,
  icon = "mail-open-outline",
  iconColour = "#7C82A1",
  title,
  body,
  actionLabel,
  onActionPress,
}: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      {loading ? (
        <ActivityIndicator size="large" color="#4E6CF6" />
      ) : (
        <Ionicons name={icon} size={32} color={iconColour} />
      )}

      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>

      {actionLabel && onActionPress ? (
        <Pressable style={styles.retryButton} onPress={onActionPress}>
          <Text style={styles.retryButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}