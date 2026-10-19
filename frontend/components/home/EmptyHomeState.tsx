import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { uiSystem as ui} from "../../src/styles/uiSystem";
import { homeStyles as styles } from "../../src/styles/homeStyles";

/**
 * EmptyHomeState
 *
 * Displays the empty state for the home screen when the user has no credentials
 * stored in their wallet.
 *
 * Responsibilities:
 * - communicate that no credentials are currently available
 * - guide the user toward their first key action (adding a credential)
 * - provide an optional secondary action for learning more about the product
 *
 * This component is typically rendered conditionally when the credential list
 * is empty.
 *
 * @returns React Native component representing the empty home state UI
 */
export default function EmptyHomeState() {
  return (
    <View style={styles.emptyStateWrap}>
      <View style={styles.emptyHeroPanel}>
        <View style={styles.emptyHeroTop}>
          <View style={styles.emptyIconBadge}>
            <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />
          </View>

        </View>

        <Image
          source={require("../../assets/Credential_Icon_Home.png")}
          style={styles.credentialLogo}
          resizeMode="contain"
        />

        <Text style={styles.title}>No Credentials Yet</Text>

        <Text style={styles.subtitle}>
          Add your first credential to start managing and sharing your business
          identity securely from one place.
        </Text>

        <Pressable
          style={[ui.primaryButton, styles.emptyPrimaryButton]}
          onPress={() => router.push("/add-credential")}
        >
          <Text style={ui.primaryButtonText}>Add Credential</Text>
        </Pressable>

        <Pressable style={styles.learnMoreButton} onPress={() => {}}>
          <Text style={styles.footerText}>Learn how it works</Text>
          <Ionicons name="arrow-forward" size={16} color="#D7DDFE" />
        </Pressable>
      </View>

    </View>
  );
}