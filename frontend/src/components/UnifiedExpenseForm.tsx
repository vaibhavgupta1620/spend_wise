// frontend/src/components/UnifiedExpenseForm.tsx
import { useState } from "react";
import { X, DollarSign, Tag, FileText, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { Expense } from "@/hooks/useExpenses";

interface UnifiedExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: Omit<Expense, "id">) => void;
  categories: string[];
}

type ExpenseMode = "personal" | "group";

interface FormState {
  amount: string;
  category: string;
  description: string;
  date: string;
  type: "expense" | "income";
  notes: string;

  // Group-only fields
  membersCount: string;
  memberNames: string; // comma-separated
}

const GROUP_CATEGORIES = ["Food", "Travel", "Shopping", "Entertainment", "Other"];

export const UnifiedExpenseForm: React.FC<UnifiedExpenseFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
}) => {
  const [expenseMode, setExpenseMode] = useState<ExpenseMode>("personal");
  const [formData, setFormData] = useState<FormState>({
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    type: "expense",
    notes: "",
    membersCount: "",
    memberNames: "",
  });

  const resetForm = () => {
    setFormData({
      amount: "",
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      notes: "",
      membersCount: "",
      memberNames: "",
    });
    setExpenseMode("personal");
  };

  const handleInternalClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.category) {
      return;
    }

    const base: any = {
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      date: formData.date,
      type: formData.type,
      expenseType: expenseMode,
      notes: formData.notes,
    };

    if (expenseMode === "group") {
      const membersCount = formData.membersCount
        ? parseInt(formData.membersCount, 10)
        : 0;

      const memberNames =
        formData.memberNames
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean) || [];

      base.membersCount = membersCount;
      base.memberNames = memberNames;
    }

    const payload = base as Omit<Expense, "id">;
    onSubmit(payload);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleInternalClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <DollarSign size={20} className="text-primary" />
              <span>Add Expense</span>
            </span>
            <button
              type="button"
              onClick={handleInternalClose}
              className="rounded-full p-1 hover:bg-muted"
            >
              <X size={18} />
            </button>
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={expenseMode}
          onValueChange={(v) => setExpenseMode(v as ExpenseMode)}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="group">Group</TabsTrigger>
          </TabsList>

          {/* PERSONAL EXPENSE FORM */}
          <TabsContent value="personal" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="flex items-center space-x-1"
                >
                  <FileText size={16} />
                  <span>Description</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Add a note..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>Date</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover"
              >
                Add Personal Expense
              </Button>
            </form>
          </TabsContent>

          {/* GROUP EXPENSE FORM */}
          <TabsContent value="group" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div className="space-y-2">
                <Label
                  htmlFor="group-amount"
                  className="flex items-center space-x-1"
                >
                  <DollarSign size={16} />
                  <span>Amount (₹)</span>
                </Label>
                <Input
                  id="group-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              {/* No of members */}
              <div className="space-y-2">
                <Label
                  htmlFor="members-count"
                  className="flex items-center space-x-1"
                >
                  <Users size={16} />
                  <span>No of Members</span>
                </Label>
                <Input
                  id="members-count"
                  type="number"
                  min={1}
                  placeholder="e.g. 3"
                  value={formData.membersCount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      membersCount: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Members name */}
              <div className="space-y-2">
                <Label htmlFor="members-names">Members Name</Label>
                <Textarea
                  id="members-names"
                  placeholder="Enter names separated by commas (e.g. Vaibhav, Richa, Ankit)"
                  value={formData.memberNames}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      memberNames: e.target.value,
                    }))
                  }
                  rows={2}
                />
              </div>

              {/* Category (fixed list) */}
              <div className="space-y-2">
                <Label
                  htmlFor="group-category"
                  className="flex items-center space-x-1"
                >
                  <Tag size={16} />
                  <span>Category</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label
                  htmlFor="group-date"
                  className="flex items-center space-x-1"
                >
                  <Calendar size={16} />
                  <span>Date</span>
                </Label>
                <Input
                  id="group-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="group-description"
                  className="flex items-center space-x-1"
                >
                  <FileText size={16} />
                  <span>Description</span>
                </Label>
                <Textarea
                  id="group-description"
                  placeholder="Add a note about this group expense..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover"
              >
                Add Group Expense
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
