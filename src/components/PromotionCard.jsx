import {
	Lock,
	ExternalLink,
} from "lucide-react";

import { Card } from "@/components/ui/card";

export function PromotionCard({
	promotion,
	isLoggedIn = false,
	onUnlock,
}) {
	const hasDiscountCode =
		Boolean(promotion?.discount_code);

	const handlePromotionClick = () => {
		if (!isLoggedIn) {
			onUnlock?.();
			return;
		}

		if (!promotion?.business_url) {
			return;
		}

		window.open(
			promotion.business_url,
			"_blank",
			"noopener,noreferrer"
		);
	};

	return (
		<article>
			<Card
				className="group relative min-h-96 overflow-hidden rounded-xl border-0 bg-transparent p-0 shadow-card transition-bounce hover:-translate-y-1 hover:shadow-glow"
			>
				{/* Clipped visual layer */}
				<div className="absolute inset-0 overflow-hidden rounded-xl">
					{/* Animated image */}
					<div className="absolute inset-0 overflow-hidden">
						<img
							src={promotion.image_url}
							alt=""
							aria-hidden="true"
							className="absolute inset-0 h-full w-full object-cover will-change-transform transition-transform duration-500 ease-out group-hover:scale-[1.02]"
						/>
					</div>

					{/* Overlay */}
					<div className="absolute inset-0 z-10 bg-linear-to-r from-background via-background/80 to-transparent" />
				</div>

				{/* Content */}
				<section className="relative z-20 flex min-h-96 items-center">
					<section className="relative max-w-xl p-6 pl-14 transition-transform duration-300 ease-out group-hover:translate-x-1 sm:p-8 sm:pl-16 md:p-10 md:pl-20">
						<header>
							<p className="text-sm font-semibold text-muted-foreground">
								{promotion.business_name}
							</p>

							<h3 className="mt-2 text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-4xl">
								{promotion.title}
							</h3>

							{promotion.description && (
								<p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
									{promotion.description}
								</p>
							)}
						</header>

						{isLoggedIn &&
						hasDiscountCode ? (
							<section
								aria-label="Member offer"
								className="mt-6"
							>
								<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									Your member code
								</p>

								<p className="mt-1 text-2xl font-bold text-primary">
									{promotion.discount_code}
								</p>

								<button
									type="button"
									onClick={
										handlePromotionClick
									}
									className="group/link mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary underline decoration-2 underline-offset-4 transition-smooth hover:opacity-80"
								>
									Visit{" "}
									{
										promotion.business_name
									}

									<ExternalLink className="size-4 transition-transform duration-300 group-hover/link:translate-x-1" />
								</button>
							</section>
						) : isLoggedIn ? (
							<section
								aria-label="Offer unavailable"
								className="mt-6"
							>
								<p className="flex items-center gap-2 text-sm font-semibold text-foreground">
									<Lock className="size-4" />

									<span>
										Offer code unavailable
									</span>
								</p>

								<p className="mt-2 text-sm text-muted-foreground">
									Please try again in a moment.
								</p>
							</section>
						) : (
							<section
								aria-label="Locked offer"
								className="mt-6"
							>
								<p className="flex items-center gap-2 text-sm font-semibold text-foreground">
									<Lock className="size-4" />

									<span>
										Exclusive member discount
									</span>
								</p>

								<button
									type="button"
									onClick={
										handlePromotionClick
									}
									className="mt-3 text-sm font-bold text-primary underline decoration-2 underline-offset-4 transition-smooth hover:opacity-80"
								>
									Click to unlock this offer
								</button>
							</section>
						)}
					</section>
				</section>
			</Card>
		</article>
	);
}
