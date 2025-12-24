import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  DollarSign,
  Bell,
  Database,
  Globe,
  Shield,
  Settings as SettingsIcon,
  Upload,
  Download,
  Trash2,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
// backend base, e.g. "http://localhost:5000"
const BACKEND_BASE = API_BASE.replace(/\/api\/?$/, "");

const Settings = () => {
  // ---- read initial user info from auth_user ----
  let initialName = "John Doe";
  let initialEmail = "john.doe@example.com";
  let initialAvatarUrl = "";

  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("auth_user");
    if (raw) {
      try {
        const user = JSON.parse(raw);
        if (user?.name) initialName = user.name;
        if (user?.email) initialEmail = user.email;
        if (user?.avatarUrl) initialAvatarUrl = user.avatarUrl;
      } catch {
        // ignore parse errors
      }
    }
  }

  const [settings, setSettings] = useState(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("appSettings")
        : null;

    if (stored) {
      const parsed = JSON.parse(stored);
      // IMPORTANT: always override with current user info
      return {
        ...parsed,
        name: initialName,
        email: initialEmail,
        avatarUrl: initialAvatarUrl,
      };
    }

    return {
      // Account Settings
      name: initialName,
      email: initialEmail,
      avatarUrl: initialAvatarUrl,

      // Expense & Budget Settings
      monthlyBudget: "5000",
      currency: "INR",
      defaultCategory: "food",
      reminderEnabled: true,

      // Notifications
      overspendingAlerts: true,
      dailyReminders: false,
      emailNotifications: true,
      pushNotifications: true,
    };
  });

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    localStorage.setItem("appSettings", JSON.stringify(settings));
  }, [settings]);

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Data Export Started",
      description: "Your data will be downloaded as CSV file.",
    });
  };

  const handleResetData = () => {
    toast({
      title: "Data Reset",
      description:
        "All data has been cleared. This action cannot be undone.",
      variant: "destructive",
    });
  };

  // ---------- Avatar upload handlers ----------
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast({
          title: "Not logged in",
          description: "Please log in again to update your profile picture.",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(`${API_BASE}/users/me/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const body = await res.json();

      if (!res.ok) {
        toast({
          title: "Upload failed",
          description: body?.message || "Could not upload profile picture.",
          variant: "destructive",
        });
        return;
      }

      const updatedUser = body.user;

      // update settings (for UI)
      setSettings((prev: any) => ({
        ...prev,
        avatarUrl: updatedUser.avatarUrl || "",
        name: updatedUser.name || prev.name,
        email: updatedUser.email || prev.email,
      }));

      // update auth_user used by rest of app
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));

      toast({
        title: "Profile picture updated",
        description: "Your new profile picture has been saved.",
      });
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast({
        title: "Upload failed",
        description: "Something went wrong while uploading.",
        variant: "destructive",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getAvatarSrc = () => {
    if (!settings.avatarUrl) return "";
    if (settings.avatarUrl.startsWith("http")) return settings.avatarUrl;
    return `${BACKEND_BASE}${settings.avatarUrl}`;
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="expense">Budget</TabsTrigger>
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        {/* ACCOUNT TAB */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your profile and account preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Picture */}
              <div className="space-y-4">
                <h3 className="font-semibold">Profile Picture</h3>
                <div className="flex items-center gap-4">
                  {settings.avatarUrl ? (
                    <img
                      src={getAvatarSrc()}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleUploadClick}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New Picture
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: max ~2MB.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Password & Security (placeholder UI) */}
              <div className="space-y-4">
                <h3 className="font-semibold">Password & Security</h3>
                <Button variant="outline">Change Password</Button>
                <Badge variant="secondary">
                  Authentication requires backend integration
                </Badge>
              </div>

              <Separator />

              {/* Danger Zone */}
              <div className="space-y-4">
                <h3 className="font-semibold text-destructive">Danger Zone</h3>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXPENSE / BUDGET TAB */}
        <TabsContent value="expense" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Expense & Budget Settings
              </CardTitle>
              <CardDescription>
                Configure your spending limits and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly-budget">Monthly Budget Limit</Label>
                  <Input
                    id="monthly-budget"
                    type="number"
                    value={settings.monthlyBudget}
                    onChange={(e) =>
                      handleSettingChange("monthlyBudget", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) =>
                      handleSettingChange("currency", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Category Budgets</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2  gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Food & Dining</span>
                    <Input className="w-24" placeholder="$500" />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Travel</span>
                    <Input className="w-24" placeholder="$200" />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Bills & Utilities</span>
                    <Input className="w-24" placeholder="$800" />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Entertainment</span>
                    <Input className="w-24" placeholder="$300" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Expense Reminder Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get daily reminders to log expenses
                  </p>
                </div>
                <Switch
                  checked={settings.reminderEnabled}
                  onCheckedChange={(checked) =>
                    handleSettingChange("reminderEnabled", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications & Alerts
              </CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Overspending Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Sends an alert notification when expenses exceed a
                      budget limit
                    </p>
                  </div>
                  <Switch
                    checked={settings.overspendingAlerts}
                    onCheckedChange={(checked) =>
                      handleSettingChange("overspendingAlerts", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Daily Expense Reminders
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Sends a reminder notification to log daily expenses
                    </p>
                  </div>
                  <Switch
                    checked={settings.dailyReminders}
                    onCheckedChange={(checked) =>
                      handleSettingChange("dailyReminders", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Triggers weekly summary email if enabled
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange("emailNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enables browser push notifications for expense alerts
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange("pushNotifications", checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DATA TAB */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data & Backup Settings
              </CardTitle>
              <CardDescription>
                Manage your data export, import, and backup options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Export Data</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3  gap-4">
                  <Button variant="outline" onClick={handleExportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as CSV
                  </Button>
                  <Button variant="outline" onClick={handleExportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as Excel
                  </Button>
                  <Button variant="outline" onClick={handleExportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as PDF
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Import Data</h3>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import from CSV
                </Button>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file to import your previous expense data
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-destructive">Reset Data</h3>
                <Button variant="destructive" onClick={handleResetData}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset All Data
                </Button>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all your expenses and cannot be
                  undone
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  );
};

export default Settings;
