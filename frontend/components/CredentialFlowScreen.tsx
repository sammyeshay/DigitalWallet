import { ReactNode } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "./AppHeader";
import { uiSystem } from "../src/styles/uiSystem";

/**
 * Props for the CredentialFlowScreen component.
 *
 * - title: header title displayed at the top of the screen
 * - children: screen-specific content rendered below the header
 * - showBack: whether to display a back button in the header
 * - showLogo: whether to display the app logo in the header
 * - bottomPadding: spacing at the bottom of the scroll container
 */
type Props = {
  title: string;
  children: ReactNode;
  showBack?: boolean;
  showLogo?: boolean;
  bottomPadding?: number;
};

/**
 * CredentialFlowScreen
 *
 * A reusable layout wrapper used for credential-related flows
 * (e.g. add credential, verification, success screens).
 *
 * Responsibilities:
 * - enforce consistent page structure (safe area + scrollable content)
 * - render a standardised AppHeader
 * - provide consistent spacing and padding across flow screens
 * - allow flexible content via children
 *
 * This component helps avoid duplication and ensures all flow screens
 * feel visually and structurally consistent.
 *
 * @param props Component props
 * @returns Screen layout with header and scrollable content
 */
export default function CredentialFlowScreen({
  title,
  children,
  showBack = true,
  showLogo = false,
  bottomPadding = 140,
}: Props) {
  return (
    /**
     * SafeAreaView ensures content does not overlap device notches,
     * status bars, or system UI elements.
     */
    <SafeAreaView style={uiSystem.safeAreaDark}>
      {/* 
        ScrollView allows content to be scrollable, which is important
        for smaller screens or longer flows.
      */}
      <ScrollView
        style={uiSystem.flowContainer}
        /**
         * contentContainerStyle controls spacing inside the scrollable area.
         * bottomPadding ensures content (especially buttons) is not cut off
         * or too close to the bottom edge.
         */
        contentContainerStyle={[
          uiSystem.contentContainer,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Standardised header used across all flow screens */}
        <AppHeader title={title} showBack={showBack} showLogo={showLogo} />

        {/* 
          Render the specific screen content passed into this layout.
        */}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}