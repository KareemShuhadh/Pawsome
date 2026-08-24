import {
	createContext,
	useContext,
	useEffect,
	useState,
} from "react";

import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;

		/*
		 * Convert a Supabase auth user into the user object
		 * used by the rest of the application.
		 *
		 * The display name is stored directly inside
		 * Supabase Auth user metadata, so there is no need
		 * to query a profiles table.
		 */
		const buildUser = async (authUser) => {
			if (!authUser) {
				if (mounted) {
					setUser(null);
				}

				return;
			}

			if (!mounted) return;

			setUser({
				...authUser,
				"display name":
					authUser.user_metadata?.["name"] ||
					null,
			});
		};

		/*
		 * 1. Get the existing session.
		 *
		 * This is responsible for the initial authentication state.
		 */
		const initializeAuth = async () => {
			const {
				data: { session },
				
			} = await supabase.auth.getSession();

			if (!mounted) return;

			await buildUser(session?.user ?? null);

			if (mounted) {
				setLoading(false);
			}
		};

		initializeAuth();

		/*
		 * 2. Listen for authentication changes.
		 */
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(
			(event, session) => {
				if (event === "INITIAL_SESSION") {
					return;
				}

				/*
				 * Schedule the update after the auth callback
				 * finishes.
				 */
				setTimeout(async () => {
					if (!mounted) return;

					if (
						event === "SIGNED_OUT" ||
						!session?.user
					) {
						setUser(null);
						setLoading(false);
						return;
					}

					await buildUser(session.user);

					if (mounted) {
						setLoading(false);
					}
				}, 0);
			}
		);

		return () => {
			mounted = false;
			subscription.unsubscribe();
		};
	}, []);

	const signUp = async (
		email,
		password,
		metadata = {}
	) => {
		const { data, error } =
			await supabase.auth.signUp({
				email,
				password,
				options: {
					data: metadata,
				},
			});

		return { data, error };
	};

	const signIn = async (email, password) => {
		const { data, error } =
			await supabase.auth.signInWithPassword({
				email,
				password,
			});

		return { data, error };
	};

	const signOut = async () => {
		const { error } =
			await supabase.auth.signOut();

		return { error };
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				signUp,
				signIn,
				signOut,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error(
			"useAuth must be used inside AuthProvider"
		);
	}

	return context;
};
