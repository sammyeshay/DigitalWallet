import React from "react";
import { View, Text, Pressable } from "react-native";
import { segmentedControlStyles as styles } from "../../src/styles/segmentedControl.styles";

export type ActiveTab = "pending" | "past" | "history";

type RequestTabsProps = {
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
};

const tabs: ActiveTab[] = ["pending", "past", "history"];

export default function RequestTabs({
  activeTab,
  onChange,
}: RequestTabsProps) {
  return (
    <View style={styles.tabWrap}>
      {tabs.map((tab) => {
        const label = tab.charAt(0).toUpperCase() + tab.slice(1);

        return (
          <Pressable
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.tabButtonActive,
            ]}
            onPress={() => onChange(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}