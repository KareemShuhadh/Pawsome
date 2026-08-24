import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { NotificationIcon } from "@/components/NotificationIcon";

export const Notification = ({
	notification,
	onDismiss,
}) => {
	if (!notification) return null;

	return (
		<aside className="fixed bottom-6 left-1/2 z-50 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-border bg-card py-3 pl-4 pr-3 shadow-glow animate-float-up">
			<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-warm">
				<NotificationIcon type={notification.type} />
			</span>

			<p className="whitespace-nowrap text-sm font-semibold text-foreground">
				{notification.message}
			</p>

			{notification.action && (
				<Link
					to={notification.action.to}
					onClick={onDismiss}
					className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground shadow-soft transition-bounce hover:-translate-y-0.5"
				>
					{notification.action.label}
				</Link>
			)}

			<button
				type="button"
				onClick={onDismiss}
				aria-label="Dismiss"
				className="shrink-0 text-muted-foreground transition-smooth hover:text-foreground"
			>
				<X className="h-4 w-4" />
			</button>
		</aside>
	);
};
