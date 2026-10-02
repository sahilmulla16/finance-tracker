import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useFinance } from "@/context/FinanceContext";
import { haptics } from "@/utils/haptics";

export const TOUR_STORAGE_KEY = "@zeno/first_use_tour_completed";

export type WalkthroughStep =
  | 0 // Step 0: Center "Let's get started" with Start button
  | 1 // Step 1: Add Bank Account
  | 2 // Step 2: Tap + button & log first expense
  | 3 // Step 3: Budgets & Insights
  | "completed";

export interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
}

interface WalkthroughContextValue {
  isActive: boolean;
  currentStep: WalkthroughStep | null;
  spotlightRect: SpotlightRect | null;
  setSpotlightRect: (rect: SpotlightRect | null) => void;
  goToStep: (step: WalkthroughStep | null) => void;
  nextStep: () => void;
  skipWalkthrough: () => Promise<void>;
  completeWalkthrough: () => Promise<void>;
  startWalkthroughManually: () => void;
  isQuickAddAlreadyEnabled: boolean;
  hasAddedExpense: boolean;
  hasAddedAccount: boolean;
}

const WalkthroughContext = createContext<WalkthroughContextValue | null>(null);

export function WalkthroughProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { onboardingState, accounts, transactions } = useFinance();
  const [currentStep, setCurrentStep] = useState<WalkthroughStep | null>(null);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(
    null,
  );
  const [isQuickAddAlreadyEnabled, setIsQuickAddAlreadyEnabled] =
    useState(false);
  const [hasAddedExpense, setHasAddedExpense] = useState(false);
  const [hasAddedAccount, setHasAddedAccount] = useState(false);

  const prevTxCountRef = useRef(transactions.length);
  const prevAccCountRef = useRef(accounts.length);

  // Check if Quick Add was already enabled
  const checkQuickAddState = useCallback(async () => {
    if (Platform.OS !== "android") {
      setIsQuickAddAlreadyEnabled(false);
      return;
    }
    try {
      const enabled =
        await NativeModules.PocketflowQuickAdd?.isAccessibilityServiceEnabled();
      setIsQuickAddAlreadyEnabled(!!enabled);
    } catch {
      setIsQuickAddAlreadyEnabled(false);
    }
  }, []);

  // Determine if walkthrough should launch on first app entry
  useEffect(() => {
    let isMounted = true;
    async function initTour() {
      await checkQuickAddState();
      try {
        const completed = await AsyncStorage.getItem(TOUR_STORAGE_KEY);
        if (isMounted) {
          // Only trigger if onboarding is finished and tour has not been completed/skipped
          if (onboardingState.completed && completed !== "true") {
            // Small delay to let initial Home screen render
            setTimeout(() => {
              if (isMounted) {
                prevTxCountRef.current = transactions.length;
                prevAccCountRef.current = accounts.length;
                setCurrentStep(0); // Launch center intro modal
              }
            }, 600);
          }
        }
      } catch {}
    }

    if (onboardingState.completed) {
      void initTour();
    }

    return () => {
      isMounted = false;
    };
  }, [onboardingState.completed, checkQuickAddState]);

  // Reactive listener: detect when a new account is added during Step 1
  useEffect(() => {
    if (currentStep === 1) {
      if (accounts.length > prevAccCountRef.current) {
        setHasAddedAccount(true);
        void haptics.success();
        // Give 700ms for user to see the created account, then smoothly navigate back to Home and move to Step 2
        const timer = setTimeout(() => {
          prevTxCountRef.current = transactions.length;
          router.replace("/(tabs)");
          setCurrentStep(2);
        }, 700);
        return () => clearTimeout(timer);
      }
    }
  }, [accounts.length, currentStep, transactions.length]);

  // Reactive listener: detect when a new expense is logged during Step 2
  useEffect(() => {
    if (currentStep === 2) {
      if (transactions.length > prevTxCountRef.current) {
        setHasAddedExpense(true);
        void haptics.success();
        // Automatically proceed to Budgets after a brief pause
        const timer = setTimeout(() => {
          setCurrentStep(3);
        }, 900);
        return () => clearTimeout(timer);
      }
    }
  }, [transactions.length, currentStep]);

  const goToStep = useCallback(
    (step: WalkthroughStep | null) => {
      if (step === 2) {
        prevTxCountRef.current = transactions.length;
      }
      if (step === 1) {
        prevAccCountRef.current = accounts.length;
      }
      setCurrentStep(step);
    },
    [transactions.length, accounts.length],
  );

  const completeWalkthrough = useCallback(async () => {
    setCurrentStep(null);
    setSpotlightRect(null);
    try {
      await AsyncStorage.setItem(TOUR_STORAGE_KEY, "true");
    } catch {}
  }, []);

  const skipWalkthrough = useCallback(async () => {
    setCurrentStep(null);
    setSpotlightRect(null);
    try {
      await AsyncStorage.setItem(TOUR_STORAGE_KEY, "true");
    } catch {}
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev === 0) {
        prevAccCountRef.current = accounts.length;
        return 1;
      }
      if (prev === 1) {
        prevTxCountRef.current = transactions.length;
        return 2;
      }
      if (prev === 2) return 3;
      if (prev === 3) return "completed";
      return null;
    });
  }, [accounts.length, transactions.length]);

  const startWalkthroughManually = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(TOUR_STORAGE_KEY);
    } catch {}
    void checkQuickAddState();
    prevTxCountRef.current = transactions.length;
    prevAccCountRef.current = accounts.length;
    setHasAddedAccount(false);
    setHasAddedExpense(false);
    router.replace("/(tabs)");
    setCurrentStep(0); // Always start from centered welcome step
  }, [checkQuickAddState, transactions.length, accounts.length]);

  return (
    <WalkthroughContext.Provider
      value={{
        isActive: currentStep !== null,
        currentStep,
        spotlightRect,
        setSpotlightRect,
        goToStep,
        nextStep,
        skipWalkthrough,
        completeWalkthrough,
        startWalkthroughManually,
        isQuickAddAlreadyEnabled,
        hasAddedExpense,
        hasAddedAccount,
      }}
    >
      {children}
    </WalkthroughContext.Provider>
  );
}

export function useWalkthrough() {
  const context = useContext(WalkthroughContext);
  if (!context) {
    return {
      isActive: false,
      currentStep: null,
      spotlightRect: null,
      setSpotlightRect: () => {},
      goToStep: () => {},
      nextStep: () => {},
      skipWalkthrough: async () => {},
      completeWalkthrough: async () => {},
      startWalkthroughManually: () => {},
      isQuickAddAlreadyEnabled: false,
      hasAddedExpense: false,
      hasAddedAccount: false,
    };
  }
  return context;
}
