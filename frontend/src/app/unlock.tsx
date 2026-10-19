import { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { verifyPassword, authenticateBiometrics } from "../../api/local-auth";
import { initialiseWalletIdentity } from "../../api/credentials";

/**
 * UnlockScreen is the wallet entry screen used to verify the user's local PIN
 * before granting access to the main app.
 *
 * Responsibilities:
 * - capture and validate a 4-digit PIN
 * - verify the PIN via local authentication logic
 * - handle lockout and setup edge cases
 * - initialise wallet identity before entering the app
 * - route the user to the main tab flow on success
 *
 * @returns React Native screen for unlocking the wallet
 */
export default function UnlockScreen() {
  /**
   * PIN currently entered by the user.
   */
  const [pin, setPin] = useState("");

  /**
   * User-facing validation or authentication error message.
   */
  const [error, setError] = useState("");

  /**
   * Prevents duplicate submissions while PIN verification is running.
   */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Ref to the hidden TextInput used to capture numeric PIN entry while showing
   * a custom visual PIN UI.
   */
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const tryBiometrics = async () => {
      const passed = await authenticateBiometrics();
      if (passed) {
        try {
          await initialiseWalletIdentity();
        } catch (e) {
          console.error("Failed to initialise wallet DID:", e);
        }
        router.replace("/(tabs)");
      }
      // if false, move to PIN auth method
    };

    tryBiometrics();
  }, []);

  
  useEffect(() => {
    const tryBiometrics = async () => {
      const passed = await authenticateBiometrics();
      if (passed) {
        try {
          await initialiseWalletIdentity();
        } catch (e) {
          console.error("Failed to initialise wallet DID:", e);
        }
        router.replace("/(tabs)");
      }
      // if false, move to PIN auth method
    };

    tryBiometrics();
  }, []);

  /**
   * Attempts to unlock the wallet using either:
   * - the current PIN stored in component state, or
   * - an override PIN supplied directly from the change handler
   *
   * Workflow:
   * 1. Ensure a 4-digit PIN is present
   * 2. Dismiss the keyboard
   * 3. Verify the PIN using local auth
   * 4. Handle success, lockout, setup, or failure cases
   * 5. Initialise wallet identity before navigation
   *
   * @param pinOverride Optional PIN value to use instead of state
   */
  const handleUnlock = async (pinOverride?: string) => {
    const pinToUse = pinOverride ?? pin;

    // Basic client-side validation before attempting auth.
    if (pinToUse.length < 4) {
      setError("Enter a 4-digit PIN");
      return;
    }

    try {
      setIsSubmitting(true);
      Keyboard.dismiss();

      const result = await verifyPassword(pinToUse);

      if (result.ok) {
        setError("");
        setPin("");

        // Ensure the wallet holder identity exists before letting the user into
        // the main application flow.
        try {
          await initialiseWalletIdentity();
        } catch (identityError) {
          console.error("Failed to initialise wallet DID:", identityError);
          setError("Unable to connect to wallet service");
          return;
        }

        router.replace("/(tabs)");
        return;
      }

      // Surface lockout duration when too many invalid attempts occur.
      if (result.reason === "locked") {
        const seconds = Math.max(
          1,
          Math.ceil((result.remainingLockoutMs ?? 0) / 1000)
        );
        setError(`Too many attempts. Try again in ${seconds}s.`);
        setPin("");
        return;
      }

      // If no PIN has been configured yet, redirect the user to PIN setup.
      if (result.reason === "not-configured") {
        setError("");
        setPin("");
        router.replace("./create-pin");
        return;
      }

      // Default invalid-auth state.
      setError("Incorrect PIN");
      setPin("");
    } catch (err) {
      setError("Unable to verify PIN");
      console.error("Unlock failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles user PIN input changes.
   *
   * Behaviour:
   * - strips non-numeric characters
   * - limits input to 4 digits
   * - clears any previous visible error
   * - automatically submits once 4 digits are entered
   *
   * @param value Raw input string from the hidden TextInput
   */
  const handleChangePin = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "").slice(0, 4);
    setPin(cleanValue);

    if (error) setError("");

    // Auto-submit once a full PIN has been entered.
    if (cleanValue.length === 4 && !isSubmitting) {
      handleUnlock(cleanValue);
    }
  };

  /**
   * Main screen render.
   *
   * Layout:
   * - safe area and keyboard-aware container
   * - touchable dismissal area for keyboard handling
   * - centered logo
   * - unlock card with custom PIN UI
   * - hidden input that powers the custom PIN boxes
   * - unlock button
   */
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={20}
      >
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
          accessible={false}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require("../../assets/Logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.title}>Enter Pin</Text>

                {/* 
                  Custom visual PIN display.
                  Tapping anywhere on the PIN row focuses the hidden input.
                */}
                <Pressable
                  style={styles.pinRow}
                  onPress={() => inputRef.current?.focus()}
                >
                  {[0, 1, 2, 3].map((index) => (
                    <View key={index} style={styles.pinBox}>
                      {index < pin.length && <View style={styles.pinDot} />}
                    </View>
                  ))}
                </Pressable>

                {/* 
                  Hidden input used to capture secure numeric PIN entry while the
                  user sees the custom PIN boxes above.
                */}
                <TextInput
                  testID="pin-input"
                  ref={inputRef}
                  value={pin}
                  onChangeText={handleChangePin}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  autoFocus
                  style={styles.hiddenInput}
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <LinearGradient
                  colors={["#4F73F6", "#6574E9"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Pressable
                    style={styles.button}
                    onPress={() => handleUnlock()}
                    disabled={isSubmitting}
                    android_disableSound
                  >
                    <Text style={styles.buttonText}>
                      {isSubmitting ? "Unlocking..." : "Unlock"}
                    </Text>
                  </Pressable>
                </LinearGradient>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Local styles for the unlock screen.
 *
 * Covers:
 * - full-screen layout and dark background
 * - keyboard-aware spacing
 * - logo placement
 * - unlock card styling
 * - custom PIN box and dot presentation
 * - error and action button styling
 */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },

  keyboardAvoidingView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flexGrow: 1,
    backgroundColor: "#050505",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },

  logoWrapper: {
    marginBottom: 42,
    alignItems: "center",
  },

  logo: {
    width: 240,
    height: 170,
  },

  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#E8E8EB",
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 34,
    paddingBottom: 26,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 12,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 28,
  },

  pinRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 30,
  },

  pinBox: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: "#D3D3D6",
    alignItems: "center",
    justifyContent: "center",
  },

  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#5B73F2",
  },

  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },

  errorText: {
    color: "#D14343",
    fontSize: 13,
    marginBottom: 10,
    textAlign: "center",
  },

  buttonGradient: {
    width: "100%",
    borderRadius: 20,
  },

  button: {
    width: "100%",
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});