import { useState, useMemo } from "react";
import { WelcomeHeader } from "./WelcomeHeader";
import { WeeklyTrendChart } from "./WeeklyTrendChart";
import { CategoryPieChart } from "./CategoryPieChart";
import { RecentExpensesTable } from "./RecentExpensesTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CreditCard, Target, TrendingUp, CheckSquare, Settings } from "lucide-react";
import { useBudgetSettings } from "@/hooks/useBudgetSettings";
import { useExpenses } from "@/hooks/useExpenses";
import { usePendingApprovals } from "@/hooks/usePendingApprovals";
import { formatCurrency } from "@/lib/utils";

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'expense' | 'income';
  expenseType: 'personal' | 'group';
  paidBy?: string;
  splitBetween?: string[];
  groupId?: string;
  groupName?: string;
  notes?: string;
}

export const Dashboard = () => {
  const { settings } = useBudgetSettings();
  const { expenses } = useExpenses();
  const { count: pendingApprovalsCount } = usePendingApprovals();

  // Calculate current month's spending from actual expenses
  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return exp.type === 'expense' &&
          expDate.getMonth() === currentMonth &&
          expDate.getFullYear() === currentYear;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  // Calculate current week's expenses
  const currentWeekExpenses = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);

    return expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return exp.type === 'expense' && expDate >= weekStart;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  // Calculate biggest category
  const biggestCategoryData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const categoryTotals = expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return exp.type === 'expense' &&
          expDate.getMonth() === currentMonth &&
          expDate.getFullYear() === currentYear;
      })
      .reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {} as Record<string, number>);

    const entries = Object.entries(categoryTotals);
    if (entries.length === 0) return { category: 'N/A', percentage: 0 };

    const biggest = entries.reduce((max, curr) =>
      curr[1] > max[1] ? curr : max
    );

    const percentage = currentMonthExpenses > 0
      ? Math.round((biggest[1] / currentMonthExpenses) * 100)
      : 0;

    return { category: biggest[0], percentage };
  }, [expenses, currentMonthExpenses]);

  const isOverBudget = currentMonthExpenses > settings.monthlyBudget;
  const remainingBudget = settings.monthlyBudget - currentMonthExpenses;

  return (
    <div className="space-y-6">
      {/* Welcome Header with Settings Button */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <WelcomeHeader currentWeekExpenses={currentWeekExpenses} />
        </div>
      </div>

      {/* Budget Alert */}
      {isOverBudget && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Budget Exceeded!</AlertTitle>
          <AlertDescription>
            You've exceeded your monthly budget by {formatCurrency(currentMonthExpenses - settings.monthlyBudget)}. Consider reviewing your expenses.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dashboard-card hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month's Spend</p>
                <p className="text-2xl font-bold text-expense">{formatCurrency(currentMonthExpenses)}</p>
              </div>
              <div className="p-3 bg-expense/10 rounded-full">
                <CreditCard className="h-6 w-6 text-expense" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Remaining Budget</p>
                <p className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-success' : 'text-expense'}`}>
                  {formatCurrency(remainingBudget)}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Biggest Category</p>
                <p className="text-lg font-bold text-foreground">{biggestCategoryData.category}</p>
                <p className="text-sm text-muted-foreground">{biggestCategoryData.percentage}% of spending</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold text-warning">{pendingApprovalsCount}</p>
                <p className="text-sm text-muted-foreground">Group expenses</p>
              </div>
              <div className="p-3 bg-warning/10 rounded-full">
                <CheckSquare className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <WeeklyTrendChart expenses={expenses} />
        <CategoryPieChart expenses={expenses} />
      </div>

      {/* Recent Expenses with Category Icons */}
      <RecentExpensesTable expenses={expenses} />



      {/* Pending Tasks */}
      {/* <PendingTasks /> */}

    </div>
  );
};
