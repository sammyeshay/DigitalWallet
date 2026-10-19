import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { tabsStyles } from "../../styles/tabs.styles";
import { tokens } from "../../styles/tokens";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,

        tabBarActiveTintColor: tokens.colours.textPrimary,
        tabBarInactiveTintColor: tokens.colours.tabInactive,

        tabBarLabelStyle: tabsStyles.label,
        tabBarIconStyle: tabsStyles.icon,
        tabBarItemStyle: tabsStyles.item,
        tabBarStyle: tabsStyles.tabBar,

        tabBarBackground: () => (
          <LinearGradient
            colors={[
              tokens.colours.tabGradientStart,
              tokens.colours.tabGradientMid,
              tokens.colours.tabGradientEnd,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tabsStyles.background}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="credentials"
        options={{
          title: "Credentials",
          tabBarLabel: "Credentials",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "card" : "card-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarLabel: "Requests",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "document-text" : "document-text-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}