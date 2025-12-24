import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

interface WelcomeHeaderProps {
  currentWeekExpenses: number;
}

export const WelcomeHeader = ({ currentWeekExpenses }: WelcomeHeaderProps) => {
  const [userName, setUserName] = useState<string>("Guest");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user");

      if (stored) {
        const user = JSON.parse(stored);

        if (user?.name) {
          // Extract only first name
          const firstName = user.name.trim().split(" ")[0];
          setUserName(firstName);
        } else if (user?.email) {
          // fallback: use email prefix
          setUserName(user.email.split("@")[0]);
        }
      }
    } catch (error) {
      console.error("Error reading user info:", error);
    }
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 animate-fade-in">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-primary mb-1 flex items-center gap-2 flex-wrap">
            <span className="truncate">
              {getGreeting()}, {userName}
            </span>
          </h1>

          <p className="text-sm md:text-base text-muted-foreground mb-2">
            {formatDate()}
          </p>

          <p className="text-base md:text-lg font-medium text-foreground">
            You've spent {formatCurrency(currentWeekExpenses)} this week
          </p>
        </div>

        <div
          className="flex items-center gap-4 animate-fade-in self-start sm:self-center"
          style={{ animationDelay: "200ms" }}
        >
        </div>
      </div>
    </div>
  );
};
