import { useState } from "react";

import {
	ChevronLeft,
	ChevronRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { PromotionCard } from "@/components/PromotionCard";
import { UnlockOfferModal } from "@/components/UnlockOfferModal";

import { usePromotions } from "@/context/PromotionContext";
import { useAuth } from "@/context/AuthContext";

export default function DealsBar() {
	const {
		promotions,
		loading,
		error,
	} = usePromotions();

	const { user } = useAuth();

	const navigate = useNavigate();

	const [currentIndex, setCurrentIndex] =
		useState(0);

	const [showUnlockModal, setShowUnlockModal] =
		useState(false);

	const handlePrevious = () => {
		if (promotions.length <= 1) {
			return;
		}

		setCurrentIndex((current) =>
			current === 0
				? promotions.length - 1
				: current - 1
		);
	};

	const handleNext = () => {
		if (promotions.length <= 1) {
			return;
		}

		setCurrentIndex((current) =>
			current === promotions.length - 1
				? 0
				: current + 1
		);
	};

	const handleUnlock = () => {
		setShowUnlockModal(true);
	};

	const handleLogin = () => {
		setShowUnlockModal(false);
		navigate("/login");
	};

	const handleRegister = () => {
		setShowUnlockModal(false);
		navigate("/register");
	};

	/*
	 * Initial loading state.
	 */
	if (loading) {
		return (
			<section
				aria-labelledby="community-offers-heading"
				className="container mx-auto mt-8 px-4"
			>
				<header className="mb-4">
					<h2
						id="community-offers-heading"
						className="text-xl font-bold leading-tight"
					>
						✨ Community Offers
					</h2>

					<p className="text-sm text-muted-foreground">
						Special offers for Pawsome members
					</p>
				</header>

				<section
					className="flex min-h-96 items-center justify-center rounded-xl bg-muted"
					aria-live="polite"
				>
					<p className="font-semibold text-muted-foreground">
						Loading offers...
					</p>
				</section>
			</section>
		);
	}

	/*
	 * Show an error only when there are
	 * no promotions available.
	 */
	if (
		error &&
		promotions.length === 0
	) {
		return (
			<section
				aria-labelledby="community-offers-heading"
				className="container mx-auto mt-8 px-4"
			>
				<header className="mb-4">
					<h2
						id="community-offers-heading"
						className="text-xl font-bold leading-tight"
					>
						✨ Community Offers
					</h2>

					<p className="text-sm text-muted-foreground">
						Special offers for Pawsome members
					</p>
				</header>

				<section
					className="rounded-xl bg-muted p-6 text-center"
					role="alert"
				>
					<p className="font-semibold">
						We couldn't load the offers right now.
					</p>

					<p className="mt-1 text-sm text-muted-foreground">
						Please try again later.
					</p>
				</section>
			</section>
		);
	}

	/*
	 * Nothing to display.
	 */
	if (promotions.length === 0) {
		return null;
	}

	/*
	 * Make sure the current index is valid
	 * even if a promotion disappears because
	 * its end time has been reached.
	 */
	const safeIndex = Math.min(
		currentIndex,
		promotions.length - 1
	);

	const currentPromotion =
		promotions[safeIndex];

	return (
		<>
			<section
				aria-labelledby="community-offers-heading"
				className="container mx-auto mt-8 px-4"
			>
				<header className="mb-4">
					<h2
						id="community-offers-heading"
						className="text-xl font-bold leading-tight"
					>
						✨ Community Offers
					</h2>

					<p className="text-sm text-muted-foreground">
						Special offers for Pawsome members
					</p>
				</header>

				<section
					className="relative"
					aria-label="Community offers"
				>
					<PromotionCard
						promotion={currentPromotion}
						isLoggedIn={Boolean(user)}
						onUnlock={handleUnlock}
					/>

					{promotions.length > 1 && (
						<>
							<button
								type="button"
								onClick={handlePrevious}
								aria-label="Previous offer"
								className="absolute left-3 top-1/2 z-30 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-soft backdrop-blur-sm transition-bounce hover:scale-105 hover:bg-background hover:shadow-card sm:left-4 sm:size-10"
							>
								<ChevronLeft className="size-5" />
							</button>

							<button
								type="button"
								onClick={handleNext}
								aria-label="Next offer"
								className="absolute right-3 top-1/2 z-30 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-soft backdrop-blur-sm transition-bounce hover:scale-105 hover:bg-background hover:shadow-card sm:right-4 sm:size-10"
							>
								<ChevronRight className="size-5" />
							</button>
						</>
					)}
				</section>

				{promotions.length > 1 && (
					<nav
						aria-label="Choose community offer"
						className="mt-4 flex justify-center gap-2"
					>
						{promotions.map(
							(promotion, index) => (
								<button
									key={promotion.id}
									type="button"
									onClick={() =>
										setCurrentIndex(index)
									}
									aria-label={`Show offer ${
										index + 1
									}`}
									aria-current={
										index === safeIndex
											? "true"
											: undefined
									}
									className={`h-2.5 rounded-full transition-all duration-300 ${
										index === safeIndex
											? "w-7 bg-primary shadow-glow"
											: "w-2.5 bg-border hover:bg-muted-foreground"
									}`}
								/>
							)
						)}
					</nav>
				)}
			</section>

			<UnlockOfferModal
				open={showUnlockModal}
				onClose={() =>
					setShowUnlockModal(false)
				}
				onLogin={handleLogin}
				onRegister={handleRegister}
			/>
		</>
	);
}
