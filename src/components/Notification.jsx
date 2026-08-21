import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { NotificationIcon } from "@/components/NotificationIcon";

export const Notification = ({
  notification,
  onDismiss,
}) => {
  if (!notification) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-float-up">
      <div className="flex items-center gap-3 pl-4 pr-3 py-3 rounded-2xl bg-card border border-border shadow-glow max-w-[calc(100vw-2rem)]">

        <div className="w-8 h-8 rounded-full bg-gradient-warm flex items-center justify-center shrink-0">
          <NotificationIcon type={notification.type} />
        </div>

        <p className="text-sm font-semibold text-foreground">
          {notification.message}
        </p>

        {notification.action && (
          <Link
            to={notification.action.to}
            onClick={onDismiss}
            className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-soft hover:-translate-y-0.5 transition-bounce shrink-0"
          >
            {notification.action.label}
          </Link>
        )}

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground transition-smooth shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};