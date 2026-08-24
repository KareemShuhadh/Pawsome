import { useEffect, useRef, useState } from "react";

import { WelcomeBanner } from "@/components/WelcomeBanner";
import { PostCard } from "@/components/PostCard";
import { TopDogs } from "@/components/TopDogs";
import { PostDetailsModal } from "@/components/PostDetailsModal";
import { Notification } from "@/components/Notification";

import { usePosts } from "@/context/PostContext";
import DealsBar from "@/components/layout/DealsBar";

export default function Home() {
	const {
		posts,
		topPosts,
		loading,
		loadingMore,
		hasMore,
		loadMorePosts,
	} = usePosts();

	const [selectedPost, setSelectedPost] =
		useState(null);

	/*
	 * ======================================================
	 * NOTIFICATION
	 * ======================================================
	 */

	const [notification, setNotification] =
		useState(() => {
			const shouldShow =
				sessionStorage.getItem(
					"pawsome-post-created-notification"
				);

			if (!shouldShow) {
				return null;
			}

			/*
			 * Consume it immediately.
			 *
			 * This means refreshing Home will NOT
			 * show the notification again.
			 */
			sessionStorage.removeItem(
				"pawsome-post-created-notification"
			);

			return {
				type: "success",
				message:
					"Your pup has been posted! 🐶🎉",
			};
		});

	const [notificationAnimation, setNotificationAnimation] =
		useState("enter");

	const notificationTimeoutRef =
		useRef(null);

	const notificationRemoveTimeoutRef =
		useRef(null);

	/*
	 * ======================================================
	 * START EXIT ANIMATION
	 * ======================================================
	 */

	const startNotificationExit = () => {
		setNotificationAnimation(
			"exit"
		);

		if (
			notificationRemoveTimeoutRef.current
		) {
			clearTimeout(
				notificationRemoveTimeoutRef.current
			);
		}

		notificationRemoveTimeoutRef.current =
			setTimeout(() => {
				setNotification(null);
				setNotificationAnimation(
					"enter"
				);

				notificationRemoveTimeoutRef.current =
					null;
			}, 900);
	};

	/*
	 * ======================================================
	 * NOTIFICATION TIMER
	 * ======================================================
	 *
	 * This effect does NOT call setState
	 * synchronously.
	 *
	 * It only creates a timer.
	 */

	useEffect(() => {
		if (!notification) {
			return;
		}

		if (
			notificationTimeoutRef.current
		) {
			clearTimeout(
				notificationTimeoutRef.current
			);
		}

		notificationTimeoutRef.current =
			setTimeout(() => {
				startNotificationExit();
			}, 3500);

		return () => {
			if (
				notificationTimeoutRef.current
			) {
				clearTimeout(
					notificationTimeoutRef.current
				);

				notificationTimeoutRef.current =
					null;
			}
		};
	}, [notification]);

	/*
	 * ======================================================
	 * CLEAN UP
	 * ======================================================
	 */

	useEffect(() => {
		return () => {
			if (
				notificationTimeoutRef.current
			) {
				clearTimeout(
					notificationTimeoutRef.current
				);
			}

			if (
				notificationRemoveTimeoutRef.current
			) {
				clearTimeout(
					notificationRemoveTimeoutRef.current
				);
			}
		};
	}, []);

	/*
	 * ======================================================
	 * DISMISS
	 * ======================================================
	 */

	const dismissNotification = () => {
		if (
			notificationTimeoutRef.current
		) {
			clearTimeout(
				notificationTimeoutRef.current
			);

			notificationTimeoutRef.current =
				null;
		}

		startNotificationExit();
	};

	/*
	 * ======================================================
	 * POST DETAILS
	 * ======================================================
	 */

	const handlePostClick = (post) => {
		setSelectedPost(post);
	};

	const handleCloseDetails = () => {
		setSelectedPost(null);
	};

	/*
	 * ======================================================
	 * LOADING
	 * ======================================================
	 */

	if (loading) {
		return (
			<main className="flex min-h-screen items-center justify-center">
				<p className="text-2xl font-bold text-primary">
					Loading dogs... 🐕
				</p>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-background pb-16">
			<WelcomeBanner />

			{/* Community Offers */}
			<DealsBar />

			<section className="container mx-auto px-4">
				{/* ================================
				    Top Dogs
				    ================================ */}

				<section className="mb-4 mt-8">
					<header className="mb-4 flex items-center gap-2">
						<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-warm text-lg text-white shadow-glow">
							🏆
						</span>

						<section>
							<h2 className="text-xl font-bold leading-tight">
								Top Dogs
							</h2>

							<p className="text-sm text-muted-foreground">
								The most-loved pups right now
							</p>
						</section>
					</header>

					<TopDogs
						posts={topPosts}
						onPostClick={handlePostClick}
					/>
				</section>

				{/* ================================
				    Fresh Pups
				    ================================ */}

				<section className="mb-4 mt-10">
					<header className="mb-6 flex items-center gap-2">
						<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-lg text-white">
							🐾
						</span>

						<section>
							<h2 className="text-xl font-bold leading-tight">
								Fresh Pups
							</h2>

							<p className="text-sm text-muted-foreground">
								Newest dogs on Pawsome
							</p>
						</section>
					</header>

					{posts.length > 0 ? (
						<section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{posts.map((post) => (
								<PostCard
									key={post.id}
									post={post}
									onClick={
										handlePostClick
									}
								/>
							))}
						</section>
					) : (
						<section className="py-12 text-center text-muted-foreground">
							<span className="mb-3 block text-4xl">
								🐶
							</span>

							<p className="font-semibold">
								No fresh pups yet.
							</p>

							<p className="mt-1 text-sm">
								Be the first to add one!
							</p>
						</section>
					)}

					{/* ================================
					    Load More
					    ================================ */}

					{hasMore && (
						<section className="mt-8 flex justify-center">
							<button
								type="button"
								onClick={
									loadMorePosts
								}
								disabled={
									loadingMore
								}
								className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-soft transition-bounce hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
							>
								{loadingMore
									? "Loading..."
									: "Load More"}
							</button>
						</section>
					)}
				</section>
			</section>

			{/* ================================
			    Post Details
			    ================================ */}

			<PostDetailsModal
				post={selectedPost}
				open={Boolean(selectedPost)}
				onClose={
					handleCloseDetails
				}
			/>

			{/* ================================
			    HOME NOTIFICATION
			    ================================ */}

			{notification && (
				<div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
					<div
						className={`
							pointer-events-auto
							w-max
							max-w-[calc(100vw-2rem)]
							${
								notificationAnimation ===
								"enter"
									? "animate-login-prompt-enter"
									: notificationAnimation ===
										  "exit"
										? "animate-login-prompt-exit"
										: ""
							}
						`}
					>
						<Notification
							notification={
								notification
							}
							onDismiss={
								dismissNotification
							}
						/>
					</div>
				</div>
			)}
		</main>
	);
}
