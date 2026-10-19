import { useRef, useState } from "react";
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
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { setPassword } from "../../api/local-auth";

/**
 * CreatePinScreen allows the user to set up a new 4-digit wallet PIN.
 *
 * The flow is split into two steps:
 * - create: user enters a new 4-digit PIN
 * - confirm: user re-enters the same PIN for confirmation
 *
 * Responsibilities:
 * - capture numeric PIN input
 * - validate PIN length and confirmation match
 * - securely save the PIN via local auth storage
 * - route the user to the unlock screen once setup is complete
 *
 * @returns React Native screen for creating and confirming a wallet PIN
 */
export default function CreatePinScreen() {
  /**
   * PIN entered during the initial "create" step.
   */
  const [pin, setPin] = useState("");

  /**
   * PIN entered during the "confirm" step.
   */
  const [confirmPin, setConfirmPin] = useState("");

  /**
   * Current step in the PIN setup flow.
   *
   * - create: enter a new PIN
   * - confirm: re-enter the PIN to verify it matches
   */
  const [step, setStep] = useState<"create" | "confirm">("create");

  /**
   * User-facing validation or save error.
   */
  const [error, setError] = useState("");

  /**
   * Prevents duplicate submissions while the PIN is being saved.
   */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Ref to the hidden TextInput used to capture numeric PIN input while showing
   * a custom visual PIN entry UI.
   */
  const inputRef = useRef<TextInput>(null);

  /**
   * Returns whichever PIN value is currently active for the visible step.
   *
   * This allows the same hidden input and same visual PIN boxes to be reused
   * across both create and confirm steps.
   */
  const activeValue = step === "create" ? pin : confirmPin;

  /**
   * Handles PIN input changes for both steps.
   *
   * Behaviour:
   * - strips any non-numeric characters
   * - limits the value to 4 digits
   * - writes into the currently active step state
   * - clears any visible error as soon as the user starts correcting input
   *
   * @param value Raw input string from the hidden TextInput
   */
  const handleChangePin = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "").slice(0, 4);

    if (step === "create") {
      setPin(cleanValue);
    } else {
      setConfirmPin(cleanValue);
    }

    if (error) setError("");
  };

  /**
   * Advances or completes the PIN setup flow depending on the current step.
   *
   * Workflow:
   * - create step:
   *   1. ensure a full 4-digit PIN has been entered
   *   2. move to confirm step
   *   3. re-focus the hidden input
   *
   * - confirm step:
   *   1. ensure confirmation PIN is 4 digits
   *   2. ensure both PIN values match
   *   3. securely save the PIN
   *   4. redirect user to the unlock screen
   */
  const handleContinue = async () => {
    if (step === "create") {
      // Require a full 4-digit PIN before allowing the user to continue.
      if (pin.length < 4) {
        setError("Enter a 4-digit PIN");
        return;
      }

      setStep("confirm");
      setError("");

      // Delay focus slightly so the input is available after the step change.
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }

    // Confirm step validation.
    if (confirmPin.length < 4) {
      setError("Confirm your 4-digit PIN");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match");
      setConfirmPin("");
      return;
    }

    try {
      setIsSubmitting(true);
      Keyboard.dismiss();

      // Persist the PIN securely using the local auth helper.
      await setPassword(pin);

      // Move user into the standard unlock flow after setup completes.
      router.replace("./unlock");
    } catch (err: any) {
      console.error("Failed to set PIN:", err);
      setError(err?.message || "Unable to save PIN");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles going back from the confirmation step to the creation step.
   *
   * This lets the user correct the original PIN if needed without losing the
   * primary value they already entered.
   */
  const handleBack = () => {
    if (step === "confirm") {
      setStep("create");
      setConfirmPin("");
      setError("");

      // Re-focus hidden input once the UI returns to the create step.
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  /**
   * Main screen render.
   *
   * Layout:
   * - safe area and keyboard-aware wrapper
   * - tap-outside keyboard dismissal
   * - centred logo
   * - PIN setup card
   * - custom PIN display boxes
   * - hidden input used for secure numeric entry
   * - continue/save action button
   * - optional back action during confirmation step
   */
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <View style={styles.logoWrapper}>
              <Image
                source={require("../../assets/Logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>
                {step === "create" ? "Create Pin" : "Confirm Pin"}
              </Text>

              <Text style={styles.subtitle}>
                {step === "create"
                  ? "Set a 4-digit PIN to secure your wallet"
                  : "Re-enter your PIN to confirm it"}
              </Text>

              {/* 
                Custom visual PIN entry row.
                Tapping the row focuses the hidden input so the keyboard opens.
              */}
              <Pressable
                style={styles.pinRow}
                onPress={() => inputRef.current?.focus()}
              >
                {[0, 1, 2, 3].map((index) => (
                  <View key={index} style={styles.pinBox}>
                    {index < activeValue.length && <View style={styles.pinDot} />}
                  </View>
                ))}
              </Pressable>

              {/* 
                Hidden text input used to capture secure numeric input while the
                user sees the custom PIN boxes above.
              */}
              <TextInput
                testID="create-pin-input"
                ref={inputRef}
                value={activeValue}
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
                  onPress={handleContinue}
                  disabled={isSubmitting}
                >
                  <Text style={styles.buttonText}>
                    {isSubmitting
                      ? "Saving securely..."
                      : step === "create"
                      ? "Continue"
                      : "Save Pin"}
                  </Text>
                </Pressable>
              </LinearGradient>

              {/* 
                Back action is only relevant once the user reaches the confirm
                step, allowing them to revise the original PIN entry.
              */}
              {step === "confirm" && (
                <Pressable style={styles.secondaryButton} onPress={handleBack}>
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Local styles for the create PIN screen.
 *
 * Covers:
 * - dark full-screen layout
 * - centred logo placement
 * - card presentation
 * - custom PIN entry UI
 * - primary and secondary action styling
 */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },

  keyboardAvoidingView: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: "#050505",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
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
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 15,
    color: "#4B4B4B",
    textAlign: "center",
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

  secondaryButton: {
    marginTop: 14,
  },

  secondaryButtonText: {
    color: "#4F73F6",
    fontSize: 16,
    fontWeight: "700",
  },
});