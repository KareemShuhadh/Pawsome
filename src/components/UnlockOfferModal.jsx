import {
	Lock,
	X,
	LogIn,
	UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function UnlockOfferModal({
	open = false,
	onClose,
	onLogin,
	onRegister,
}) {
	if (!open) {
		return null;
	}

	return (
		<section
			className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-labelledby="unlock-offer-title"
			aria-describedby="unlock-offer-description"
		>
			<Card className="relative w-full max-w-lg overflow-hidden border border-border bg-card shadow-card shadow-glow">
				{/* Close button */}
				<button
					type="button"
					onClick={onClose}
					aria-label="Close unlock offer"
					className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-bounce hover:bg-secondary hover:text-foreground"
				>
					<X className="size-5" />
				</button>

				<section className="px-8 py-10 text-center sm:px-10 sm:py-12">
					{/* Lock icon */}
					<span
						aria-hidden="true"
						className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-warm text-white shadow-glow transition-bounce hover:scale-105"
					>
						<Lock className="size-7" />
					</span>

					{/* Heading */}
					<header className="mt-6">
						<h2
							id="unlock-offer-title"
							className="text-2xl font-bold sm:text-3xl"
						>
							Unlock this offer
						</h2>

						<p
							id="unlock-offer-description"
							className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base"
						>
							Create an account or log in to reveal
							the discount code and access this
							exclusive deal.
						</p>
					</header>

					{/* Authentication actions */}
					<section
						aria-label="Account actions"
						className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
					>
						<Button
							type="button"
							variant="outline"
							onClick={onLogin}
							className="h-11 w-full rounded-full border-2 border-primary px-6 font-bold text-primary transition-bounce hover:bg-primary hover:text-primary-foreground sm:w-auto"
						>
							<LogIn
								aria-hidden="true"
								className="size-4"
							/>
							Log In
						</Button>

						<Button
							type="button"
							onClick={onRegister}
							className="h-11 w-full rounded-full bg-gradient-warm px-6 font-bold text-primary-foreground shadow-glow transition-bounce hover:-translate-y-0.5 hover:shadow-card sm:w-auto"
						>
							<UserPlus
								aria-hidden="true"
								className="size-4"
							/>
							Join
						</Button>
					</section>

					{/* Cancel */}
					<button
						type="button"
						onClick={onClose}
						className="mt-6 rounded-full px-4 py-2 text-sm font-bold text-muted-foreground transition-bounce hover:bg-secondary hover:text-foreground"
					>
						Cancel
					</button>
				</section>
			</Card>
		</section>
	);
}