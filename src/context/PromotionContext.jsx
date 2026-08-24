import {
	createContext,
	useContext,
	useEffect,
	useState,
} from "react";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const PromotionContext = createContext(null);

export const PromotionProvider = ({ children }) => {
	const {
		user,
		loading: authLoading,
	} = useAuth();

	const [promotions, setPromotions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		let mounted = true;

		const fetchPromotions = async () => {
			if (authLoading) {
				return;
			}

			if (mounted) {
				setError(null);
			}

			const now = new Date().toISOString();

			/* Fetch active promotions within their schedule. */
			const {
				data: promotionData,
				error: promotionError,
			} = await supabase
				.from("promotions")
				.select("*")
				.eq("is_active", true)
				.or(
					`starts_at.is.null,starts_at.lte.${now}`
				)
				.or(
					`ends_at.is.null,ends_at.gte.${now}`
				)
				.order("created_at", {
					ascending: false,
				});

			if (!mounted) {
				return;
			}

			if (promotionError) {
				setError(promotionError);
				setLoading(false);

				return;
			}

			/* Show promotions without codes to logged-out users. */
			if (!user) {
				setPromotions(
					(promotionData ?? []).map(
						(promotion) => ({
							...promotion,
							discount_code: null,
						})
					)
				);

				setLoading(false);

				return;
			}

			/* Load discount codes for logged-in users. */
			const {
				data: codeData,
				error: codeError,
			} = await supabase
				.from("promotion_codes")
				.select(
					"promotion_id, discount_code"
				);

			if (!mounted) {
				return;
			}

			if (codeError) {
				/*
				 * Keep promotions visible even if
				 * the code request fails.
				 */
				setPromotions(
					(promotionData ?? []).map(
						(promotion) => ({
							...promotion,
							discount_code: null,
						})
					)
				);

				setError(codeError);
				setLoading(false);

				return;
			}

			/* Attach each promotion's matching discount code. */
			const promotionsWithCodes =
				(promotionData ?? []).map(
					(promotion) => {
						const matchingCode =
							codeData?.find(
								(item) =>
									item.promotion_id ===
									promotion.id
							);

						return {
							...promotion,
							discount_code:
								matchingCode?.discount_code ??
								null,
						};
					}
				);

			if (!mounted) {
				return;
			}

			setPromotions(
				promotionsWithCodes
			);

			setLoading(false);
		};

		/* Fetch once when the provider mounts. */
		fetchPromotions();

		/* Refresh so scheduled promotions stay current. */
		const intervalId = window.setInterval(
			fetchPromotions,
			60 * 1000
		);

		return () => {
			mounted = false;
			window.clearInterval(intervalId);
		};
	}, [user, authLoading]);

	return (
		<PromotionContext.Provider
			value={{
				promotions,
				loading:
					authLoading || loading,
				error,
			}}
		>
			{children}
		</PromotionContext.Provider>
	);
};

export const usePromotions = () => {
	const context =
		useContext(PromotionContext);

	if (!context) {
		throw new Error(
			"usePromotions must be used inside PromotionProvider"
		);
	}

	return context;
};
