import { Home } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NoActivityProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

const NoActivity = ({ title, description, icon: Icon = Home }: NoActivityProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 max-w-md">
      <div className="w-16 h-16 rounded-full bg-surface-inset border border-line flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-ink-subtle" />
      </div>
      <h2 className="text-xl font-medium tracking-tight text-ink mb-2">
        {title}
      </h2>
      <p className="text-center text-ink-muted">{description}</p>
    </div>
  );
};

export default NoActivity;
