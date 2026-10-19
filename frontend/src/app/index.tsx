import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { hasPassword } from "../../api/local-auth";
import { tokens } from "../styles/tokens";
import { uiSystem } from "../styles/uiSystem";

/**
 * Index Screen (App Entry Point)
 *
 * This screen acts as a gatekeeper for the app and determines where the user
 * should be routed on launch.
 *
 * Responsibilities:
 * - check whether a PIN/password has already been configured locally
 * - show a loading state while the check is in progress
 * - redirect the user to the appropriate screen:
 *    - unlock screen (if PIN exists)
 *    - create PIN screen (if no PIN is configured)
 *
 * This ensures users always land in the correct authentication state.
 *
 * @returns A loading screen or a redirect to the appropriate auth flow
 */
export default function Index() {
  /**
   * Tracks whether the initial password check is still in progress.
   */
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Indicates whether a PIN/password has already been configured on the device.
   */
  const [pinConfigured, setPinConfigured] = useState(false);

  /**
   * Runs once on component mount to determine if a PIN exists.
   *
   * Workflow:
   * 1. Call hasPassword() to check secure storage
   * 2. Store result in state
   * 3. Handle any unexpected errors safely
   * 4. Stop loading regardless of outcome
   */
  useEffect(() => {
    const checkPassword = async () => {
      try {
        const configured = await hasPassword();
        setPinConfigured(configured);
      } catch (error) {
        // If the check fails, default to "not configured" to avoid blocking access.
        console.error("Failed to check stored PIN:", error);
        setPinConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPassword();
  }, []);

  /**
   * While checking local auth state, show a full-screen loading indicator.
   *
   * Prevents premature navigation and avoids flicker between screens.
   */
  if (isLoading) {
    return (
      <View style={[uiSystem.fullscreenCenter, uiSystem.darkScreen]}>
        <ActivityIndicator
          size="large"
          color={tokens.colours.brandBlueMid}
        />
      </View>
    );
  }

  /**
   * Once loading completes, redirect user based on PIN state:
   *
   * - If PIN exists → go to unlock screen
   * - If no PIN → go to create PIN screen
   *
   * Redirect is used instead of navigation to prevent this screen from being
   * part of the back stack.
   */
  return <Redirect href={pinConfigured ? "./unlock" : "./create-pin"} />;
}
