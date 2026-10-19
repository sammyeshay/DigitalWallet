import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { uiSystem as styles } from "../../src/styles/uiSystem";

type ErrorBannerProps = {
  message: string;
};

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle-outline" size={18} color="#B42318" />
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}