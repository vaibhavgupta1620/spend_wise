// src/pages/Login.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UserLocal = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || "").toLowerCase();

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<"email" | "verify" | "newPassword">("email");
  const [resetEmail, setResetEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // ref for signup form so "Use admin email" can populate safely
  const signupFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const token = localStorage.getItem("auth_token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  // ---------- Helper: API calls ----------
  async function registerUser(name: string, email: string, password: string) {
    try {
      const res = await fetch(`${API_BASE}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      let body = null;
      try { body = await res.json(); } catch { body = null; }
      return { ok: res.ok, status: res.status, body };
    } catch (err) {
      return { ok: false, status: 0, body: null, error: (err as any).message || String(err) };
    }
  }

  async function loginUser(email: string, password: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      let body = null;
      try { body = await res.json(); } catch { body = null; }
      return { ok: res.ok, status: res.status, body };
    } catch (err) {
      return { ok: false, status: 0, body: null, error: (err as any).message || String(err) };
    }
  }

  async function checkUserExists(email: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/users?email=${encodeURIComponent(email)}`);
      if (!res.ok) return false;
      const body = await res.json();
      if (Array.isArray(body)) {
        return body.some((u: any) => (u.email || "").toLowerCase() === email.toLowerCase());
      }
      if (body && body.email) return (body.email || "").toLowerCase() === email.toLowerCase();
      return false;
    } catch {
      return false;
    }
  }

  // ---------- Handlers ----------
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    const email = ((formData.get("email") as string) || "").trim().toLowerCase();
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const res = await registerUser(name, email, password);
      if (res.ok) {
        toast({ title: "Account created!", description: "Please login with your credentials." });
        setActiveTab("login");
        (e.target as HTMLFormElement).reset();
      } else {
        const msg = res.body?.message || res.error || `Status ${res.status}`;
        toast({ title: "Signup failed", description: msg, variant: "destructive" });
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      toast({ title: "Signup error", description: err?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = ((formData.get("email") as string) || "").trim().toLowerCase();
    const password = formData.get("password") as string;

    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const res = await loginUser(email, password);
      if (!res.ok) {
        const msg = res.body?.message || res.error || `Status ${res.status}`;
        toast({ title: "Login failed", description: msg || "Invalid credentials", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const body = res.body || {};
      const { token, user } = body;
      if (!token) {
        toast({ title: "Login failed", description: "No token received", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // store token and user
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user || {}));

      toast({ title: "Login successful!", description: `Welcome back, ${user?.name || "user"}!` });

      setIsLoading(false);
      navigate("/");
    } catch (err: any) {
      console.error("Login error:", err);
      toast({ title: "Login error", description: err?.message || "Something went wrong", variant: "destructive" });
      setIsLoading(false);
    }
  };

  // ----- Forgot password flow (UI preserved) -----
  const handleForgotPasswordEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = ((formData.get("email") as string) || "").trim().toLowerCase();
    if (!email) {
      toast({ title: "Error", description: "Please enter your email.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const exists = await checkUserExists(email);
    if (!exists) {
      toast({ title: "Error", description: "No account found with this email address.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setResetEmail(email);

    toast({ title: "Verification code sent!", description: `Your code is: ${code} (In production, this would be sent via email)` });
    setResetStep("verify");
    setIsLoading(false);
  };

  const handleVerifyCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const code = formData.get("code") as string;

    if (code !== generatedCode) {
      toast({ title: "Error", description: "Invalid verification code.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    toast({ title: "Code verified!", description: "Please enter your new password." });
    setResetStep("newPassword");
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, code: generatedCode, newPassword }),
      });

      if (res.ok) {
        toast({ title: "Password reset successful!", description: "You can now login with your new password." });
      } else {
        toast({ title: "Password reset (simulation)", description: "Password reset simulated on frontend (implement backend endpoint for real behavior)." });
      }

      setShowForgotPassword(false);
      setResetStep("email");
      setResetEmail("");
      setVerificationCode("");
      setGeneratedCode("");
      setActiveTab("login");
    } catch (err: any) {
      console.error("Reset password error:", err);
      toast({ title: "Error", description: "Unable to reset password right now.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ----- Admin-email helper -----
  const useAdminEmail = (form: HTMLFormElement | null) => {
    if (!ADMIN_EMAIL) return;
    const emailInput = form?.querySelector('input[name="email"]') as HTMLInputElement | null;
    if (emailInput) emailInput.value = ADMIN_EMAIL;
    const nameInput = form?.querySelector('input[name="name"]') as HTMLInputElement | null;
    if (nameInput) nameInput.focus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {showForgotPassword ? "Reset Password" : "Welcome"}
          </CardTitle>
          <CardDescription className="text-center">
            {showForgotPassword ? "Follow the steps to reset your password" : "Login or create an account to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showForgotPassword ? (
            <div className="space-y-4">
              {resetStep === "email" && (
                <form onSubmit={handleForgotPasswordEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email Address</Label>
                    <Input id="reset-email" name="email" type="email" placeholder="name@example.com" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Verification Code
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setShowForgotPassword(false)}>
                    Back to Login
                  </Button>
                </form>
              )}

              {resetStep === "verify" && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verify-code">Verification Code</Label>
                    <Input id="verify-code" name="code" type="text" placeholder="Enter 6-digit code" maxLength={6} required />
                    <p className="text-xs text-muted-foreground">Check the toast notification for your verification code</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify Code
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => { setResetStep("email"); setGeneratedCode(""); }}>
                    Resend Code
                  </Button>
                </form>
              )}

              {resetStep === "newPassword" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input id="new-password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter new password" minLength={6} required />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Confirm new password" minLength={6} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Reset Password
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" name="email" type="email" placeholder="name@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input id="login-password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" required />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Login
                  </Button>
                  <div className="text-center">
                    <Button type="button" variant="link" className="text-sm text-muted-foreground hover:text-primary" onClick={() => { setShowForgotPassword(true); setResetStep("email"); }}>
                      Forgot Password?
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form ref={signupFormRef} onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Name</Label>
                    <Input id="signup-name" name="name" type="text" placeholder="Enter Your Full Name" required />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signup-email">Email</Label>
                      {ADMIN_EMAIL && (
                        <Button type="button" variant="link" className="text-xs" onClick={() => useAdminEmail(signupFormRef.current)}>
                          Use admin email
                        </Button>
                      )}
                    </div>
                    <Input id="signup-email" name="email" type="email" placeholder="name@example.com" required />
                    <p className="text-xs text-muted-foreground mt-1">
                      {ADMIN_EMAIL && `Tip: using ${ADMIN_EMAIL} will signal admin signup (backend must still grant the role).`}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input id="signup-password" name="password" type={showPassword ? "text" : "password"} placeholder="Create a password" required minLength={6} />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign Up
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
