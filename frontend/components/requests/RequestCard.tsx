import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WalletRequest, getRequestTimeLabel } from "../../api/requests";
import { requestsStyles as styles } from "../../src/styles/requests.styles";

type RequestCardProps = {
  request: WalletRequest;
  onPress: (request: WalletRequest) => void | Promise<void>;
};

function getButtonLabel(request: WalletRequest) {
  if (request.source === "credential_expiry") {
    return "View";
  }

  return request.type === "pending" ? "Action" : "View";
}

export default function RequestCard({ request, onPress }: RequestCardProps) {
  return (
    <Pressable style={styles.requestCard} onPress={() => void onPress(request)}>
      <View style={styles.iconWrap}>
        <Ionicons name={request.icon} size={24} color="#FFFFFF" />
      </View>

      <Text style={styles.requestTypeText}>{request.title}</Text>
      <Text style={styles.organisationText}>{request.organisation}</Text>
      <Text style={styles.requestSubtitle}>{request.subtitle}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.timeText}>{getRequestTimeLabel(request)}</Text>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: request.statusColour },
            ]}
          />
          <Text style={styles.statusText}>{request.statusLabel}</Text>
        </View>
      </View>

      <View style={styles.viewButton}>
        <Text style={styles.viewButtonText}>{getButtonLabel(request)}</Text>
      </View>
    </Pressable>
  );
}