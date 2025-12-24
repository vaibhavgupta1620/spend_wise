import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TaskEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (count: number | string) => void;
  taskLabel: string;
  currentCount: number | string;
  isMonetary?: boolean;
}

export const TaskEditModal = ({
  open,
  onOpenChange,
  onSave,
  taskLabel,
  currentCount,
  isMonetary = false
}: TaskEditModalProps) => {
  const [count, setCount] = useState(currentCount.toString());

  const handleSave = () => {
    if (isMonetary) {
      const numValue = parseFloat(count.replace(/[^0-9.-]/g, ''));
      onSave(`₹${numValue.toFixed(2)}`);
    } else {
      onSave(parseInt(count) || 0);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update {taskLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="count">
              {isMonetary ? "Amount" : "Count"}
            </Label>
            <Input
              id="count"
              type={isMonetary ? "number" : "number"}
              value={count.toString().replace(/[^0-9.-]/g, '')}
              onChange={(e) => setCount(e.target.value)}
              placeholder={isMonetary ? "Enter amount" : "Enter count"}
              step={isMonetary ? "0.01" : "1"}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
