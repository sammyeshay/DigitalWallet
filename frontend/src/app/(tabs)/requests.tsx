import React, { useMemo, useState, useCallback } from "react";
import { ScrollView, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

// Reusable UI components used to build the requests screen layout
import AppHeader from "../../../components/AppHeader";
import RequestTabs, {
  ActiveTab,
} from "../../../components/requests/RequestTabs";
import RequestCard from "../../../components/requests/RequestCard";
import ActivityCard from "../../../components/requests/ActivityCard";
import EmptyState from "../../../components/requests/EmptyState";
import ErrorBanner from "../../../components/requests/ErrorBanner";

// Shared UI system styles
import { uiSystem } from "../../styles/uiSystem";

// API functions for credential, request, and activity data retrieval/sync
import {
  fetchCredentials,
  fetchCredentialById,
  FrontendCredential,
} from "../../../api/credentials";
import {
  WalletRequest,
  fetchRequests,
  syncRequestsFromCredentials,
  completeRequest,
  markRequestAsRead,
} from "../../../api/requests";
import {
  fetchActivityHistory,
  WalletActivity,
} from "../../../api/activity";

// Utility used to filter out malformed or unsupported activity records
import { isDisplayableActivity } from "../../utils/activityHelpers";

/**
 * RequestsScreen
 *
 * Displays three related views of request-driven user activity:
 *
 * - Pending: active requests that may require attention
 * - Past: completed or historical requests
 * - History: credential lifecycle activity (share, verify, expiry, revoke)
 *
 * Data is refreshed whenever the screen gains focus to keep state aligned
 * with the wallet and backend.
 */
export default function RequestsScreen() {
  /**
   * Currently selected tab (pending | past | history)
   */
  const [activeTab, setActiveTab] = useState<ActiveTab>("pending");

  /**
   * Request and activity data state
   */
  const [requests, setRequests] = useState<WalletRequest[]>([]);
  const [activityHistory, setActivityHistory] = useState<WalletActivity[]>([]);

  /**
   * UI state flags
   */
  const [loading, setLoading] = useState(true);
  const [openingActivityId, setOpeningActivityId] = useState<string | null>(
    null
  );

  /**
   * Error states surfaced via banners or empty states
   */
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);

  /**
   * Loads all screen data:
   * - syncs requests from credentials
   * - fetches stored requests
   * - fetches activity history
   *
   * Errors are handled independently so one failure does not block the entire screen.
   */
  const loadScreenData = useCallback(async () => {
    setLoading(true);
    setRequestsError(null);
    setActivityError(null);

    try {
      const credentials = (await fetchCredentials()) as FrontendCredential[];
      await syncRequestsFromCredentials(credentials);
    } catch (error) {
      console.error("Failed to sync requests from credentials", error);
      setRequestsError("Requests could not be refreshed.");
    }

    try {
      const storedRequests = await fetchRequests();
      setRequests(Array.isArray(storedRequests) ? storedRequests : []);
    } catch (error) {
      console.error("Failed to load requests", error);
      setRequests([]);
      setRequestsError("Requests could not be loaded.");
    }

    try {
      const storedActivity = await fetchActivityHistory();

      const safeActivity = Array.isArray(storedActivity)
        ? storedActivity.filter(isDisplayableActivity)
        : [];

      setActivityHistory(safeActivity);
    } catch (error) {
      console.error("Failed to load activity history", error);
      setActivityHistory([]);
      setActivityError("Activity history could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh data whenever the screen gains focus.
   */
  useFocusEffect(
    useCallback(() => {
      void loadScreenData();
    }, [loadScreenData])
  );

  /**
   * Filters requests based on the active tab.
   */
  const visibleRequests = useMemo(() => {
    return requests.filter((request) => request.type === activeTab);
  }, [requests, activeTab]);

  /**
   * Handles user interaction with a request card.
   *
   * Behaviour varies depending on:
   * - request type (pending vs past)
   * - request source (expiry vs standard)
   * - presence of linked credential
   */
  const handleRequestPress = async (request: WalletRequest) => {
    await markRequestAsRead(request.id);

    if (request.source === "credential_expiry") {
      if (request.type === "pending") {
        await completeRequest(request.id);
      }

      if (request.credentialId) {
        router.push({
          pathname: "/credential/[id]",
          params: { id: request.credentialId },
        });
      } else {
        router.push("/(tabs)/credentials");
      }
      return;
    }

    if (request.credentialId && request.type === "past") {
      router.push({
        pathname: "/credential/[id]",
        params: { id: request.credentialId },
      });
      return;
    }

    if (request.type === "pending") {
      await completeRequest(request.id);
    }

    await loadScreenData();
  };

  /**
   * Handles user interaction with an activity card.
   *
   * Opens the associated credential if available.
   */
  const handleActivityPress = async (activity: WalletActivity) => {
    if (!activity.credentialId) {
      Alert.alert(
        "Credential unavailable",
        "This activity entry is not linked to a credential."
      );
      return;
    }

    try {
      setOpeningActivityId(activity.id);

      const credential = await fetchCredentialById(activity.credentialId);

      if (!credential?.credential_id) {
        Alert.alert(
          "Credential unavailable",
          "The linked credential could not be found in the wallet."
        );
        return;
      }

      router.push({
        pathname: "/credential/[id]",
        params: { id: credential.credential_id },
      });
    } catch (error) {
      console.error("Failed to open credential from activity", error);
      Alert.alert(
        "Credential unavailable",
        "The linked credential is no longer available or could not be opened."
      );
    } finally {
      setOpeningActivityId(null);
    }
  };

  /**
   * Renders the History tab content.
   */
  const renderHistory = () => {
    if (loading) {
      return (
        <EmptyState
          loading
          title="Loading history"
          body="Fetching recent credential activity from your wallet."
        />
      );
    }

    if (activityError) {
      return (
        <EmptyState
          icon="alert-circle-outline"
          iconColour="#D14343"
          title="History unavailable"
          body={activityError}
          actionLabel="Try Again"
          onActionPress={() => void loadScreenData()}
        />
      );
    }

    if (activityHistory.length === 0) {
      return (
        <EmptyState
          icon="time-outline"
          title="No activity history"
          body="Credential activity will appear here when credentials are presented, verified, expired, or revoked."
        />
      );
    }

    return activityHistory.map((activity) => (
      <ActivityCard
        key={activity.id}
        activity={activity}
        isOpening={openingActivityId === activity.id}
        onPress={handleActivityPress}
      />
    ));
  };

  /**
   * Renders the Pending and Past request tabs.
   */
  const renderRequests = () => {
    if (loading) {
      return (
        <EmptyState
          loading
          title="Loading requests"
          body="Syncing credential notifications and request history."
        />
      );
    }

    if (visibleRequests.length === 0) {
      return (
        <EmptyState
          icon="mail-open-outline"
          title={`No ${activeTab} requests`}
          body={`You do not have any ${activeTab} verification or credential requests right now.`}
        />
      );
    }

    return visibleRequests.map((request) => (
      <RequestCard
        key={request.id}
        request={request}
        onPress={handleRequestPress}
      />
    ));
  };

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
          <AppHeader title="Requests" showLogo />


          <View style={uiSystem.body}>
            {activeTab !== "history" && requestsError ? (
              <ErrorBanner message={requestsError} />
            ) : null}

            <RequestTabs activeTab={activeTab} onChange={setActiveTab} />

            <View style={uiSystem.panel}>
              {activeTab === "history" ? renderHistory() : renderRequests()}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
