import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WalletActivity } from "../../api/activity";
import { requestsStyles as styles } from "../../src/styles/requests.styles";
import {
  formatActivityAction,
  formatActivityTimeLabel,
  getActivityAccentColour,
  getActivityIconName,
} from "../../src/utils/activityHelpers";

type ActivityCardProps = {
  activity: WalletActivity;
  isOpening: boolean;
  onPress: (activity: WalletActivity) => void | Promise<void>;
};

export default function ActivityCard({
  activity,
  isOpening,
  onPress,
}: ActivityCardProps) {
  const accentColour = getActivityAccentColour(activity.actionType);
  const actionLabel = activity.summary?.trim()
    ? activity.summary
    : formatActivityAction(activity.actionType);

  return (
    <Pressable
      style={styles.requestCard}
      onPress={() => void onPress(activity)}
      disabled={isOpening}
    >
      <View style={[styles.iconWrap, { backgroundColor: accentColour }]}>
        {isOpening ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons
            name={getActivityIconName(activity.actionType)}
            size={24}
            color="#FFFFFF"
          />
        )}
      </View>

      <Text style={styles.requestTypeText}>{activity.credentialTitle}</Text>

      <Text style={styles.organisationText}>
        {activity.metadata?.issuer ||
          (activity.source === "verifier"
            ? "Verifier activity"
            : activity.source === "system"
              ? "System activity"
              : "Wallet activity")}
      </Text>

      <Text style={styles.requestSubtitle}>{actionLabel}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.timeText}>
          {formatActivityTimeLabel(activity.timestamp)}
        </Text>

        <View style={styles.statusRow}>
          <View
            style={[styles.statusDot, { backgroundColor: accentColour }]}
          />
          <Text style={styles.statusText}>
            {formatActivityAction(activity.actionType)}
          </Text>
        </View>
      </View>

      <View style={[styles.viewButton, isOpening && styles.viewButtonDisabled]}>
        <Text style={styles.viewButtonText}>
          {isOpening ? "Opening..." : "View Credential"}
        </Text>
      </View>
    </Pressable>
  );
}