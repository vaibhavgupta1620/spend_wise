import { useState, useEffect } from "react";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Expense } from "@/components/Dashboard";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

const categories = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health & Fitness",
  "Travel",
  "Other"
];

export const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedExpenses = localStorage.getItem('spendwise-expenses');
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('spendwise-expenses', JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
      expenseType: 'personal' as const
    };
    setExpenses(prev => [newExpense, ...prev]);
    setIsFormOpen(false);

    toast({
      title: "Expense Added",
      description: `${formatCurrency(expense.amount)} for ${expense.category}`,
    });
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
    toast({
      title: "Expense Deleted",
      description: "Transaction removed successfully",
    });
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Expenses</h1>
          <p className="text-muted-foreground">Manage all your expenses and income</p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-primary hover:bg-primary-hover"
        >
          <Plus size={20} className="mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="dashboard-card">
        <ExpenseList
          expenses={expenses}
          onDelete={deleteExpense}
          showAll={true}
        />
      </div>

      <ExpenseForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={addExpense}
        categories={categories}
      />
    </div>
  );
};