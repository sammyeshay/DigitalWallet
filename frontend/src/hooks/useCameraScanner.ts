import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

/**
 * Handles camera barcode scanning with debounce and re-entry guards.
 * Resets automatically when the screen regains focus.
 *
 * @param onScan  Called once per unique scan (or after cooldown). Throw to show an error.
 * @param cooldownMs  Minimum ms between identical scanned values (default 2500).
 */
export function useCameraScanner(
  onScan: (data: string) => Promise<void>,
  cooldownMs = 2500
) {
  const [hasScanned, setHasScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanError, setScanError] = useState("");

  const isHandlingRef = useRef(false);
  const lastValueRef = useRef<string | null>(null);
  const lastTimeRef = useRef(0);

  const reset = useCallback(() => {
    setHasScanned(false);
    setIsProcessing(false);
    setScanError("");
    isHandlingRef.current = false;
    lastValueRef.current = null;
    lastTimeRef.current = 0;
  }, []);

  useFocusEffect(useCallback(() => { reset(); }, [reset]));

  const onBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      const trimmed = data.trim();
      const now = Date.now();

      if (isHandlingRef.current) return;
      if (
        lastValueRef.current === trimmed &&
        now - lastTimeRef.current < cooldownMs
      ) return;

      isHandlingRef.current = true;
      lastValueRef.current = trimmed;
      lastTimeRef.current = now;
      setHasScanned(true);
      setIsProcessing(true);
      setScanError("");

      try {
        await onScan(trimmed);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong while processing the QR code.";
        setScanError(message);
        setHasScanned(false);
        isHandlingRef.current = false;
      } finally {
        setIsProcessing(false);
      }
    },
    [onScan, cooldownMs]
  );

  return { hasScanned, isProcessing, scanError, setScanError, onBarcodeScanned, reset };
}
