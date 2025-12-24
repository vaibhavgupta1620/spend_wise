import { Plus, Receipt, FileText, MapPin } from "lucide-react";

interface QuickActionProps {
  onNewExpense: () => void;
}

export const QuickAccess = ({ onNewExpense }: QuickActionProps) => {
  const actions = [
    { 
      icon: Plus, 
      label: "New expense", 
      color: "bg-pink-500/20 text-pink-400 hover:bg-pink-500/30",
      onClick: onNewExpense
    },
    { 
      icon: Receipt, 
      label: "Add receipt", 
      color: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
      onClick: () => console.log("Add receipt")
    },
    { 
      icon: FileText, 
      label: "Create report", 
      color: "bg-teal-500/20 text-teal-400 hover:bg-teal-500/30",
      onClick: () => console.log("Create report")
    },
    { 
      icon: MapPin, 
      label: "Create trip", 
      color: "bg-red-500/20 text-red-400 hover:bg-red-500/30",
      onClick: () => console.log("Create trip")
    },
  ];

  return (
    <div className="dashboard-card">
      <h2 className="text-lg font-semibold text-card-foreground mb-4">Quick Access</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`quick-action-btn ${action.color}`}
          >
            <action.icon size={20} />
            <span className="font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};