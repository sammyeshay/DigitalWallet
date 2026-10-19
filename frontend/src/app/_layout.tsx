import { Stack, router } from "expo-router";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function handleNotificationNavigation(
  response: Notifications.NotificationResponse | null
) {
  if (!response) return;

  const data = response.notification.request.content.data as {
    credentialId?: string;
    screen?: string;
  };

  if (data?.screen === "credential-detail" && data?.credentialId) {
    router.push({
      pathname: "/credential/[id]",
      params: {
        id: data.credentialId,
      },
    });
    return;
  }

  router.push("/(tabs)/credentials");
}

export default function RootLayout() {
  useEffect(() => {
    let isMounted = true;

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted) return;
      handleNotificationNavigation(response);
    });

    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationNavigation(response);
      });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="create-pin" />
      <Stack.Screen name="unlock" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-credential" />
      <Stack.Screen name="credential-form" />
      <Stack.Screen name="credential-created" />
      <Stack.Screen name="select-disclosures" />
      <Stack.Screen
        name="credential/[id]"
        options={{
          title: "Credential Details",
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}