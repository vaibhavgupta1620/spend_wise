import {
  DollarSign,
  Sun,
  Moon,
  Menu,
  LogOut,
  Shield,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

/* ================= TYPES ================= */
interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

/* ================= NAV ================= */
const baseNavigationItems = [
  { label: "Dashboard", path: "/" },
  { label: "Expenses", path: "/expenses" },
  { label: "Settings", path: "/settings" },
  { label: "Support", path: "/support" },
];

export const Header: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const rawUser = localStorage.getItem("auth_user");

    if (!token) {
      setUser(null);
      return;
    }

    if (rawUser) {
      try {
        setUser(JSON.parse(rawUser));
        return;
      } catch {
        localStorage.removeItem("auth_user");
      }
    }

    // fallback: fetch user profile
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem("auth_user", JSON.stringify(data.user));
        }
      } catch {
        setUser(null);
      }
    })();
  }, []);

  const isLoggedIn = !!user;

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    // Auth cleanup
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");

    // 🔥 RESET LOADER (VERY IMPORTANT)
    localStorage.removeItem("spendwise_intro_seen");

    setUser(null);

    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });

    navigate("/login");
  };

  /* ================= NAV ITEMS ================= */
  const navigationItems = (() => {
    const items = [...baseNavigationItems];
    if (user?.role === "admin") {
      items.splice(1, 0, { label: "Admin", path: "/admin" });
    }
    return items;
  })();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 hover-scale">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-500 rounded-lg flex items-center justify-center">
            <DollarSign size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl text-gradient-primary hidden sm:inline">
            SpendWise
          </span>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/70 hover:text-foreground hover:bg-accent"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Admin quick access */}
          {user?.role === "admin" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin")}
              title="Admin dashboard"
            >
              <Shield className="h-5 w-5" />
            </Button>
          )}

          {/* Logout (desktop) */}
          {isLoggedIn && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[280px]">
              <div className="flex flex-col gap-4 mt-8">

                {user?.role === "admin" && (
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/admin");
                    }}
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Admin
                  </Button>
                )}

                {isLoggedIn && (
                  <Button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                )}

                <nav className="flex flex-col gap-1">
                  {navigationItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/70 hover:text-foreground hover:bg-accent"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
