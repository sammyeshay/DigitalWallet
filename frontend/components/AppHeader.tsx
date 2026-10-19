import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { tokens } from "../src/styles/tokens";

type Props = {
  title: string;
  showBack?: boolean;
  showLogo?: boolean;
};

export default function AppHeader({
  title,
  showBack = false,
  showLogo = true,
}: Props) {
  return (
    <View style={styles.wrapper} testID="app-header">
      <LinearGradient
        colors={[
          tokens.colours.tabGradientStart,
          tokens.colours.tabGradientMid,
          tokens.colours.tabGradientEnd,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.leftRail}>
          {showBack ? (
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
            >
              <Text style={styles.backText}>‹</Text>
            </Pressable>
          ) : null}

          {showLogo ? (
            <Image
              source={require("../assets/Logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : null}
        </View>

        <View pointerEvents="none" style={styles.titleContainer}>
          <Text
            style={styles.title}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        </View>

        <View style={styles.bottomDivider} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    zIndex: 20,
  },

  header: {
    width: "100%",
    minHeight: 118,
    paddingTop: 18,
    paddingBottom: 24,
    position: "relative",
    justifyContent: "center",
  },

  leftRail: {
    position: "absolute",
    left: 16,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 2,
  },

  titleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 88,
    zIndex: 1,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  backText: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "700",
    lineHeight: Platform.OS === "ios" ? 34 : 36,
    marginTop: -2,
  },

  logo: {
    width: 58,
    height: 58,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.6,
    textShadowColor: "rgba(0,0,0,0.14)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  bottomDivider: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
});