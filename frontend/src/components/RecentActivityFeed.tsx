// frontend/src/components/RecentActivityFeed.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CreditCard, TrendingUp, Users } from "lucide-react";
import type { Expense } from "@/hooks/useExpenses";
import { formatCurrency } from "@/lib/utils";

interface RecentActivityFeedProps {
  expenses: Expense[];
}

export const RecentActivityFeed = ({ expenses }: RecentActivityFeedProps) => {
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  const recent = [...expenses]
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    .slice(0, 6);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {recent.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Activity className="h-10 w-10 mx-auto mb-2" />
            No recent activity. Add an expense to see it here.
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((expense) => {
              const isGroup = expense.expenseType === "group";
              const hasMembers =
                isGroup && (expense.membersCount || 0) > 0;
              const perHead =
                hasMembers && expense.amount && expense.membersCount
                  ? expense.amount / expense.membersCount
                  : null;

              return (
                <div
                  key={expense.id}
                  className="flex items-start justify-between rounded-lg border bg-card/40 px-3 py-2 sm:px-4 sm:py-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-primary/10 p-2">
                      {expense.type === "income" ? (
                        <TrendingUp className="h-3 w-3 text-primary" />
                      ) : (
                        <CreditCard className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm">
                          {expense.description || expense.category}
                        </span>
                        <Badge
                          variant={
                            expense.type === "income" ? "secondary" : "outline"
                          }
                          className="text-[10px] px-2 py-0.5"
                        >
                          {expense.type === "income" ? "Income" : "Expense"}
                        </Badge>
                        {isGroup && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0.5 flex items-center gap-1"
                          >
                            <Users className="h-3 w-3" />
                            Group
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeDate(expense.date)} • {expense.category}
                      </p>
                      {isGroup && hasMembers && (
                        <p className="text-xs text-muted-foreground">
                          {expense.membersCount} member
                          {expense.membersCount && expense.membersCount > 1
                            ? "s"
                            : ""}{" "}
                          {expense.memberNames &&
                            expense.memberNames.length > 0 && (
                              <>
                                •{" "}
                                <span className="font-medium">
                                  {expense.memberNames.join(", ")}
                                </span>
                              </>
                            )}
                          {perHead && (
                            <>
                              {" "}
                              • Split{" "}
                              <span className="font-semibold">
                                {formatCurrency(perHead)}
                              </span>{" "}
                              each
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold">
                    {expense.type === "income" ? "+" : "-"}
                    {formatCurrency(expense.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
