import { useState, useEffect } from "react";

export interface BudgetSettings {
  monthlyBudget: number;
  currentSpending: number;
  biggestCategory: string;
  biggestCategoryPercentage: number;
}

const DEFAULT_SETTINGS: BudgetSettings = {
  monthlyBudget: 50000,
  currentSpending: 35000,
  biggestCategory: "Food & Dining",
  biggestCategoryPercentage: 40,
};

// Helper: Identify user and return per-user storage key
const getBudgetStorageKey = () => {
  if (typeof window === "undefined") return "budgetSettings_guest";

  const raw = localStorage.getItem("auth_user");
  if (!raw) return "budgetSettings_guest";

  try {
    const user = JSON.parse(raw);
    const id = user?._id || user?.id || user?.email;
    return id ? `budgetSettings_${id}` : "budgetSettings_guest";
  } catch {
    return "budgetSettings_guest";
  }
};

export const useBudgetSettings = () => {
  const [storageKey] = useState<string>(() => getBudgetStorageKey());

  const [settings, setSettings] = useState<BudgetSettings>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save budget settings:", e);
    }
  }, [settings, storageKey]);

  const updateSettings = (newSettings: Partial<BudgetSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return { settings, updateSettings, resetSettings };
};
