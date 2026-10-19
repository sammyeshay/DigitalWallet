import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import {
  getSelections,
  hasSelections,
  setSelections,
} from "../stores/disclosureStore";
import { credentialFlowStyles as styles } from "../styles/credentialFlow";

function buildDisclosureMap(disclosuresStr: string): Record<string, string> {
  if (!disclosuresStr) return {};

  const map: Record<string, string> = {};

  for (const part of disclosuresStr.split("~").filter(Boolean)) {
    try {
      const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const arr: unknown[] = JSON.parse(atob(padded));

      if (typeof arr[1] === "string") {
        map[arr[1]] = part;
      }
    } catch {
      // Ignore malformed disclosure values so the screen remains usable.
    }
  }

  return map;
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map((word) =>
      word === word.toUpperCase()
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ")
    .trim();
}

export default function SelectDisclosuresScreen() {
  const params = useLocalSearchParams<{
    credentialId?: string;
    title?: string;
    disclosures?: string;
  }>();

  const credentialId = params.credentialId ?? "";
  const title = params.title ?? "Credential";
  const disclosuresStr = params.disclosures ?? "";

  const disclosureMap = useMemo(
    () => buildDisclosureMap(disclosuresStr),
    [disclosuresStr]
  );

  const fields = useMemo(() => Object.keys(disclosureMap), [disclosureMap]);

  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    if (hasSelections(credentialId)) {
      return getSelections()[credentialId];
    }

    return Object.fromEntries(fields.map((field) => [field, true]));
  });

  const handleSave = () => {
    setSelections(credentialId, toggles);
    router.back();
  };

  return (
    <SafeAreaView style={styles.selectDisclosures_safeArea} edges={["top", "left", "right"]}>
      <LinearGradient
        colors={["#285CD4", "#3652DA", "#7253D4", "#B971B5"]}
        locations={[0, 0.28, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.selectDisclosures_gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.heroCard}>
            <Text style={styles.selectDisclosures_pageTitle}>{title}</Text>

            <Text style={styles.selectDisclosures_pageSubtitle}>
              Toggle off any fields you do not want to disclose to the verifier.
            </Text>

            {fields.length === 0 ? (
              <View style={styles.selectDisclosures_emptyStateCard}>
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color="#6B7280"
                  style={styles.selectDisclosures_emptyStateIcon}
                />
                <Text style={styles.selectDisclosures_noFieldsText}>
                  This credential has no selectively disclosable fields.
                </Text>
              </View>
            ) : (
              <View style={styles.selectDisclosures_toggleCard}>
                {fields.map((field, index) => {
                  const isOn = toggles[field] ?? true;
                  const isLast = index === fields.length - 1;

                  return (
                    <View
                      key={field}
                      style={[
                        styles.selectDisclosures_toggleRow,
                        !isLast && styles.selectDisclosures_toggleRowBorder,
                      ]}
                    >
                      <Text style={styles.selectDisclosures_toggleLabel}>
                        {formatFieldLabel(field)}
                      </Text>

                      <Switch
                        value={isOn}
                        onValueChange={(value) =>
                          setToggles((prev) => ({
                            ...prev,
                            [field]: value,
                          }))
                        }
                        trackColor={{ false: "#CBD5E1", true: "#22C55E" }}
                        thumbColor={isOn ? "#008000" : "#64748B"}
                        style={styles.selectDisclosures_toggleSwitch}
                      />
                    </View>
                  );
                })}
              </View>
            )}

            <Pressable style={styles.selectDisclosures_primaryButton} onPress={handleSave}>
              <Text style={styles.selectDisclosures_primaryButtonText}>Save</Text>
            </Pressable>

            <Pressable style={styles.selectDisclosures_secondaryButton} onPress={() => router.back()}>
              <Text style={styles.selectDisclosures_secondaryButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}