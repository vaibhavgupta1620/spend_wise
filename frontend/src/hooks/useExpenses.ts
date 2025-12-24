// frontend/src/hooks/useExpenses.ts
import { useState, useEffect } from "react";
import {
  getExpenses,
  createExpense as apiCreateExpense,
  updateExpense as apiUpdateExpense,
  deleteExpense as apiDeleteExpense,
} from "@/services/api";

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: "expense" | "income";
  expenseType: "personal" | "group";
  paidBy?: string;
  splitBetween?: string[];
  groupId?: string;
  groupName?: string;
  notes?: string;
  // ✅ Group specific
  membersCount?: number;
  memberNames?: string[];
}

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const fetchExpenses = async () => {
    try {
      const data = await getExpenses();
      const normalised: Expense[] = (data || []).map((exp: any) => ({
        id: exp.id || exp._id,
        amount: exp.amount,
        category: exp.category,
        description: exp.description || "",
        date: exp.date,
        type: exp.type || "expense",
        expenseType: exp.expenseType || "personal",
        paidBy: exp.paidBy,
        splitBetween: exp.splitBetween || [],
        groupId: exp.groupId,
        groupName: exp.groupName,
        notes: exp.notes,
        membersCount: exp.membersCount,
        memberNames: exp.memberNames,
      }));
      setExpenses(normalised);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const addExpense = async (expense: Omit<Expense, "id">) => {
    try {
      const created = await apiCreateExpense(expense);
      const normalised: Expense = {
        id: created.id || created._id,
        amount: created.amount,
        category: created.category,
        description: created.description || "",
        date: created.date,
        type: created.type || "expense",
        expenseType: created.expenseType || "personal",
        paidBy: created.paidBy,
        splitBetween: created.splitBetween || [],
        groupId: created.groupId,
        groupName: created.groupName,
        notes: created.notes,
        membersCount: created.membersCount,
        memberNames: created.memberNames,
      };
      setExpenses((prev) => [normalised, ...prev]);
    } catch (error) {
      console.error("Failed to create expense", error);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await apiDeleteExpense(id);
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    } catch (error) {
      console.error("Failed to delete expense", error);
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const updated = await apiUpdateExpense(id, updates);
      setExpenses((prev) =>
        prev.map((exp) =>
          exp.id === id
            ? {
              ...exp,
              ...updates,
              amount: updated.amount ?? exp.amount,
              category: updated.category ?? exp.category,
              description: updated.description ?? exp.description,
              date: updated.date ?? exp.date,
              type: (updated.type as any) ?? exp.type,
              expenseType: (updated.expenseType as any) ?? exp.expenseType,
              paidBy: updated.paidBy ?? exp.paidBy,
              splitBetween: updated.splitBetween ?? exp.splitBetween,
              groupId: updated.groupId ?? exp.groupId,
              groupName: updated.groupName ?? exp.groupName,
              notes: updated.notes ?? exp.notes,
              membersCount: updated.membersCount ?? exp.membersCount,
              memberNames: updated.memberNames ?? exp.memberNames,
            }
            : exp
        )
      );
    } catch (error) {
      console.error("Failed to update expense", error);
    }
  };

  return {
    expenses,
    addExpense,
    deleteExpense,
    updateExpense,
    refreshExpenses: fetchExpenses,
  };
};