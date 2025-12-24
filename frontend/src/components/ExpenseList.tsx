// frontend/src/components/ExpenseList.tsx
import { useState } from "react";
import { Trash2, Calendar, Tag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Expense } from "@/hooks/useExpenses";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  showAll?: boolean;
}

export const ExpenseList = ({
  expenses,
  onDelete,
  showAll = false,
}: ExpenseListProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const visibleExpenses = showAll ? expenses : expenses.slice(0, 10);

  const toggleSplit = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (visibleExpenses.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No expenses to show.
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-3">
        {visibleExpenses.map((expense) => {
          const isGroup = expense.expenseType === "group";
          const hasMembers = isGroup && (expense.membersCount || 0) > 0;
          const perHead =
            hasMembers && expense.amount && expense.membersCount
              ? expense.amount / expense.membersCount
              : null;

          return (
            <div
              key={expense.id}
              className="group flex flex-col gap-2 rounded-lg border bg-card px-3 py-2 sm:px-4 sm:py-3 hover:bg-muted/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm sm:text-base">
                      {expense.description || expense.category}
                    </span>
                    <Badge variant={isGroup ? "outline" : "secondary"}>
                      {isGroup ? "Group" : "Personal"}
                    </Badge>
                    {isGroup && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Users className="h-3 w-3" />
                        {expense.membersCount ?? 0}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(expense.date)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {expense.category}
                    </span>
                    {isGroup && perHead && (
                      <span className="inline-flex items-center gap-1">
                        Split:
                        <span className="font-semibold">
                          ₹{perHead.toFixed(2)}
                        </span>
                        / member
                      </span>
                    )}
                  </div>

                  {isGroup && (
                    <div className="mt-1 text-xs sm:text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          No. of members:{" "}
                          <span className="font-medium">
                            {expense.membersCount ?? "-"}
                          </span>
                        </span>
                        {perHead && (
                          <button
                            type="button"
                            onClick={() => toggleSplit(expense.id)}
                            className="text-primary text-xs font-medium hover:underline"
                          >
                            {expanded[expense.id] ? "Hide split" : "View split"}
                          </button>
                        )}
                      </div>

                      {expanded[expense.id] && (
                        <div className="mt-1 space-y-1">
                          {expense.memberNames &&
                            expense.memberNames.length > 0 && (
                              <p className="text-muted-foreground break-words">
                                Members:{" "}
                                <span className="font-medium">
                                  {expense.memberNames.join(", ")}
                                </span>
                              </p>
                            )}
                          {perHead && (
                            <p className="text-muted-foreground">
                              Split equally:{" "}
                              <span className="font-semibold">
                                ₹{perHead.toFixed(2)}
                              </span>{" "}
                              per member
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-semibold">
                      {expense.type === "income" ? "+" : "-"}₹
                      {expense.amount.toFixed(2)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(expense.id)}
                    className="opacity-60 hover:opacity-100 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
