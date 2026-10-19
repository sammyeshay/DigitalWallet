import { View, Text, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { credentialFlowStyles as styles } from "../styles/credentialFlow";
import { tokens } from "../styles/tokens";
import { uiSystem } from "../styles/uiSystem";

/**
 * CredentialCreatedScreen
 *
 * Displays a success confirmation after a credential has been successfully
 * issued and stored in the wallet.
 *
 * Responsibilities:
 * - read the credential name from route params
 * - present a success state UI (tick + confirmation messaging)
 * - provide a clear next action (navigate to credentials list)
 *
 * This screen is part of the credential issuance flow and is typically reached
 * after scanning or accepting a credential offer.
 *
 * @returns React Native success confirmation screen
 */
export default function CredentialCreatedScreen() {
  /**
   * Route parameters passed from the previous step in the credential flow.
   *
   * credentialName is optional and used to personalise the success message.
   */
  const { credentialName } = useLocalSearchParams<{ credentialName?: string }>();

  /**
   * Fallback to a default credential label if none is provided.
   *
   * Ensures the UI remains stable even if upstream params are missing.
   */
  const title = credentialName ?? "Director ID";

  return (
    <SafeAreaView style={uiSystem.safeArea} edges={["top", "left", "right"]}>
      <LinearGradient
        colors={tokens.gradients.primary}
        locations={[0, 0.28, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={uiSystem.gradient}
      >
        <View style={styles.createdScreen}>
          <View style={styles.createdContent}>
            <View style={styles.createdCard}>
              <View style={styles.createdSuccessCircle}>
                <Text style={styles.createdSuccessTick}>✓</Text>
              </View>


              <Text style={styles.createdSuccessHeading}>{title} Verified</Text>


              <Text style={styles.createdSuccessText}>
                Your {title} has been successfully added to your wallet.
              </Text>


              <Pressable
                style={styles.createdPrimaryButton}
                onPress={() =>
                  router.replace({
                    pathname: "/(tabs)/credentials",
                    params: { justAdded: "true" },
                  })
                }
              >
                <Text style={styles.createdPrimaryButtonText}>
                  View Credentials
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
