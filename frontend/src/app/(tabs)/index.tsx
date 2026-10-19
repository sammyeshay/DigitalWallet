import React, { useCallback, useMemo, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import AppHeader from "../../../components/AppHeader";
import { tokens } from "../../styles/tokens";
import { uiSystem } from "../../styles/uiSystem";
import { homeStyles } from "../../styles/homeStyles";
import {
  fetchCredentials,
  FrontendCredential,
} from "../../../api/credentials";
import { triggerExpiryNotifications } from "../../../api/expiry-notifications";

import EmptyHomeState from "../../../components/home/EmptyHomeState";
import PopulatedHomeState from "../../../components/home/PopulatedHomeState";
import {
  countPendingRequests,
  areAllCredentialsValid,
} from "../../../components/home/home.helpers";

/**
 * Home screen
 *
 * Displays the wallet landing view after the user is authenticated.
 *
 * Responsibilities:
 * - load credentials whenever the screen gains focus
 * - trigger expiry notifications for loaded credentials
 * - show loading state while wallet data is being prepared
 * - render either the empty or populated home state
 *
 * @returns Home screen UI
 */
export default function HomeScreen() {
  /**
   * Loaded wallet credentials.
   */
  const [credentials, setCredentials] = useState<FrontendCredential[]>([]);

  /**
   * Loading flag for the wallet overview.
   */
  const [loading, setLoading] = useState(true);

  /**
   * Loads wallet credentials and triggers expiry notifications.
   */
  const loadCredentials = useCallback(async () => {
    try {
      const data = await fetchCredentials();
      const list = Array.isArray(data) ? data : [];
      setCredentials(list);

      await triggerExpiryNotifications(list);
    } catch (error) {
      console.error("Failed to load credentials", error);
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reload credentials each time the screen regains focus.
   */
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadCredentials();
    }, [loadCredentials])
  );

  /**
   * Accepted credentials are the ones that should count as "real" credentials
   * for the populated home state.
   *
   * Pending credentials are excluded so that returning from the add flow without
   * actually adding anything does not show an empty populated state.
   */
  const acceptedCredentials = useMemo(
    () => credentials.filter((cred) => cred.raw?.pending !== true),
    [credentials]
  );

  /**
   * Primary credential shown in the populated home view.
   */
  const defaultCredential = useMemo(() => {
    return acceptedCredentials.length > 0 ? acceptedCredentials[0] : undefined;
  }, [acceptedCredentials]);

  /**
   * Whether the wallet currently contains any accepted credentials.
   *
   * This is the condition that controls whether the home screen shows the empty
   * state or the populated state.
   */
  const hasAcceptedCredentials = acceptedCredentials.length > 0;

  /**
   * Number of pending requests derived from the credential list.
   */
  const pendingCount = useMemo(
    () => countPendingRequests(credentials),
    [credentials]
  );

  /**
   * Aggregate wallet health indicator used by the populated home state.
   */
  const allCredentialsValid = useMemo(
    () => areAllCredentialsValid(acceptedCredentials),
    [acceptedCredentials]
  );

  return (
    <SafeAreaView style={uiSystem.safeArea} edges={["top", "left", "right"]}>
      <LinearGradient
        colors={["#285CD4", "#3652DA", "#7253D4", "#B971B5"]}
        locations={[0, 0.28, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={uiSystem.gradient}
      >
        <ScrollView
          contentContainerStyle={uiSystem.container}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[0]}
        >
          <AppHeader title="Home" showLogo />


          <View style={uiSystem.body}>
            {loading ? (
              <View style={homeStyles.loadingCard}>
                <ActivityIndicator
                  size="large"
                  color={tokens.colours.brandBlueMid}
                />
                <Text style={homeStyles.loadingTitle}>
                  Loading wallet overview
                </Text>
                <Text style={homeStyles.loadingText}>
                  Preparing your credentials, requests, and wallet activity.
                </Text>
              </View>
            ) : !hasAcceptedCredentials ? (
              <EmptyHomeState />
            ) : (
              <PopulatedHomeState
                defaultCredential={defaultCredential}
                credentials={acceptedCredentials}
                pendingCount={pendingCount}
                allCredentialsValid={allCredentialsValid}
              />
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
