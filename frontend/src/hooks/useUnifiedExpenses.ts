// frontend/src/hooks/useUnifiedExpenses.ts
import { useState, useEffect, useMemo } from "react";
import { useExpenses, Expense } from "./useExpenses";
import { useTrips } from "./useTrips";
import { useToast } from "./use-toast";
import {
  getExpenses as apiGetExpenses,
  createExpense as apiCreateExpense,
} from "@/services/api";

export interface UnifiedMetrics {
  totalSpent: number;
  personalSpent: number;
  groupSpent: number;
  remainingBudget: number;
  biggestCategory: string;
  biggestCategoryPercentage: number;
  pendingApprovals: number;
}

export const useUnifiedExpenses = () => {
  const { expenses: personalExpenses, addExpense: addPersonalExpense } =
    useExpenses();
  const { trips } = useTrips();
  const [groupExpenses, setGroupExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // ✅ Fetch group expenses from backend (MongoDB), not localStorage
  const fetchGroupExpenses = async () => {
    try {
      setLoading(true);
      const all = await apiGetExpenses();
      const group = (all || []).filter(
        (exp: any) => exp.expenseType === "group"
      );

      const formatted: Expense[] = group.map((exp: any) => ({
        id: exp.id || exp._id,
        amount: exp.amount,
        category: exp.category,
        description: exp.description || "",
        date: exp.date,
        type: exp.type || "expense",
        expenseType: "group",
        paidBy: exp.paidBy,
        splitBetween: exp.splitBetween || [],
        groupId: exp.groupId,
        groupName: exp.groupName || "Group",
        notes: exp.notes,
        membersCount: exp.membersCount,
        memberNames: exp.memberNames,
      }));

      setGroupExpenses(formatted);
    } catch (error) {
      console.error("Error fetching group expenses from API:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupExpenses();
  }, [trips]);

  // Combine all expenses
  const allExpenses = useMemo(() => {
    const personal = personalExpenses.map((exp) => ({
      ...exp,
      expenseType: "personal" as const,
    }));
    const group = groupExpenses.map((exp) => ({
      ...exp,
      expenseType: "group" as const,
    }));

    return [...personal, ...group].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [personalExpenses, groupExpenses]);

  // Unified metrics for dashboard
  const metrics = useMemo<UnifiedMetrics>(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthExpenses = allExpenses.filter((exp) => {
      const expDate = new Date(exp.date);
      return (
        exp.type === "expense" &&
        expDate.getMonth() === currentMonth &&
        expDate.getFullYear() === currentYear
      );
    });

    const totalSpent = currentMonthExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    const personalSpent = currentMonthExpenses
      .filter((exp) => exp.expenseType === "personal")
      .reduce((sum, exp) => sum + exp.amount, 0);
    const groupSpent = currentMonthExpenses
      .filter((exp) => exp.expenseType === "group")
      .reduce((sum, exp) => sum + exp.amount, 0);

    const byCategory = new Map<string, number>();
    for (const exp of currentMonthExpenses) {
      const key = exp.category || "Uncategorised";
      byCategory.set(key, (byCategory.get(key) || 0) + exp.amount);
    }

    let biggestCategory = "N/A";
    let biggestCategoryAmount = 0;
    byCategory.forEach((amount, cat) => {
      if (amount > biggestCategoryAmount) {
        biggestCategoryAmount = amount;
        biggestCategory = cat;
      }
    });

    const budgetSettings =
      typeof window !== "undefined"
        ? localStorage.getItem("budgetSettings")
        : null;
    const monthlyBudget = budgetSettings
      ? JSON.parse(budgetSettings).monthlyBudget
      : 50000;

    const biggestCategoryPercentage =
      totalSpent > 0 ? (biggestCategoryAmount / totalSpent) * 100 : 0;

    return {
      totalSpent,
      personalSpent,
      groupSpent,
      remainingBudget: monthlyBudget - totalSpent,
      biggestCategory,
      biggestCategoryPercentage,
      pendingApprovals: 0,
    };
  }, [allExpenses]);

  // ✅ Add expense (personal → uses original hook; group → goes to DB)
  const addExpense = async (expense: Omit<Expense, "id">) => {
    if (expense.expenseType === "personal") {
      await addPersonalExpense(expense);
      return;
    }

    if (expense.expenseType === "group") {
      try {
        await apiCreateExpense(expense);

        toast({
          title: "Expense Added",
          description: "Group expense added successfully",
        });

        await fetchGroupExpenses();
      } catch (error) {
        console.error("Error adding group expense:", error);
        toast({
          title: "Error",
          description: "Failed to add group expense",
          variant: "destructive",
        });
      }
    }
  };

  return {
    allExpenses,
    personalExpenses: personalExpenses.map((exp) => ({
      ...exp,
      expenseType: "personal" as const,
    })),
    groupExpenses,
    metrics,
    loading,
    addExpense,
    refreshGroupExpenses: fetchGroupExpenses,
  };
};
