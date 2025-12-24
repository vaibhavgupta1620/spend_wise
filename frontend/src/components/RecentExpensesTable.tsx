// frontend/src/components/RecentExpensesTable.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Utensils,
  Car,
  ShoppingBag,
  Lightbulb,
  Film,
  Heart,
  Plane,
  MoreHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import type { Expense } from "@/hooks/useExpenses";
import { formatCurrency } from "@/lib/utils";
import { useExpenses } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/use-toast";

interface RecentExpensesTableProps {
  expenses: Expense[];
}

const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, JSX.Element> = {
    "Food & Dining": <Utensils className="h-4 w-4" />,
    Transportation: <Car className="h-4 w-4" />,
    Shopping: <ShoppingBag className="h-4 w-4" />,
    "Bills & Utilities": <Lightbulb className="h-4 w-4" />,
    Entertainment: <Film className="h-4 w-4" />,
    "Health & Fitness": <Heart className="h-4 w-4" />,
    Travel: <Plane className="h-4 w-4" />,
  };

  return iconMap[category] || <MoreHorizontal className="h-4 w-4" />;
};

export const RecentExpensesTable = ({ expenses }: RecentExpensesTableProps) => {
  const { deleteExpense } = useExpenses();
  const { toast } = useToast();

  const recentExpenses = [...expenses]
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 5);

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    toast({
      title: "Expense deleted",
      description: "The expense has been removed from your records.",
    });
  };

  if (recentExpenses.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <p className="text-muted-foreground text-sm">
          No recent expenses. Add your first one to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base sm:text-lg">
          Recent Expenses
        </h3>
        <span className="text-xs text-muted-foreground">
          Last {recentExpenses.length} entries
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground border-b">
            <tr>
              <th className="py-2 pr-2 text-left">Date</th>
              <th className="py-2 px-2 text-left">Category</th>
              <th className="py-2 px-2 text-left">Description</th>
              <th className="py-2 px-2 text-right">Amount</th>
              <th className="py-2 px-2 text-left">Members / Split</th>
              <th className="py-2 pl-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentExpenses.map((expense) => {
              const isGroup = expense.expenseType === "group";
              const hasMembers =
                isGroup && (expense.membersCount || 0) > 0;
              const perHead =
                hasMembers && expense.amount && expense.membersCount
                  ? expense.amount / expense.membersCount
                  : null;

              return (
                <tr
                  key={expense.id}
                  className="border-b last:border-0 hover:bg-muted/40"
                >
                  <td className="py-2 pr-2 whitespace-nowrap">
                    {new Date(expense.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(expense.category)}
                      <span>{expense.category}</span>
                      {isGroup && (
                        <Badge variant="outline" className="ml-1">
                          Group
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="max-w-[220px] truncate">
                      {expense.description || "-"}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right font-medium">
                    {expense.type === "income" ? "+" : "-"}
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="py-2 px-2 text-xs align-top">
                    {isGroup && hasMembers ? (
                      <div className="flex flex-col gap-1">
                        <div className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>
                            {expense.membersCount} member
                            {expense.membersCount && expense.membersCount > 1
                              ? "s"
                              : ""}
                          </span>
                        </div>
                        {expense.memberNames &&
                          expense.memberNames.length > 0 && (
                            <div className="text-muted-foreground truncate max-w-[180px]">
                              {expense.memberNames.join(", ")}
                            </div>
                          )}
                        {perHead && (
                          <div className="text-muted-foreground">
                            Split:{" "}
                            <span className="font-semibold">
                              {formatCurrency(perHead)}
                            </span>{" "}
                            / member
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
