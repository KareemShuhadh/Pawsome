import { MyPostCard } from "@/components/MyPostCard";
import { EditPostForm } from "@/components/EditPostForm";
import { PostDetailsModal } from "@/components/PostDetailsModal";
import { Notification } from "@/components/Notification";

import { usePosts } from "@/context/PostContext";
import { useAuth } from "@/context/AuthContext";

import { Link } from "react-router-dom";
import {
	useEffect,
	useRef,
	useState,
} from "react";

export default function MyPosts() {
	const [editingPost, setEditingPost] =
		useState(null);

	const [selectedPost, setSelectedPost] =
		useState(null);

	/*
	 * ======================================================
	 * NOTIFICATION
	 * ======================================================
	 */

	const [notification, setNotification] =
		useState(null);

	const [notificationAnimation, setNotificationAnimation] =
		useState("enter");

	const notificationTimeoutRef =
		useRef(null);

	const removeNotificationTimeoutRef =
		useRef(null);

	/*
	 * ======================================================
	 * AUTH
	 * ======================================================
	 */

	const {
		user,
		loading: authLoading,
	} = useAuth();

	/*
	 * ======================================================
	 * POSTS
	 * ======================================================
	 */

	const {
		userPosts,
		userPostsLoading,
		deletePost,
		updatePost,
	} = usePosts();

	/*
	 * ======================================================
	 * NOTIFICATION CLEANUP
	 * ======================================================
	 */

	useEffect(() => {
		return () => {
			if (notificationTimeoutRef.current) {
				clearTimeout(
					notificationTimeoutRef.current
				);
			}

			if (
				removeNotificationTimeoutRef.current
			) {
				clearTimeout(
					removeNotificationTimeoutRef.current
				);
			}
		};
	}, []);

	/*
	 * ======================================================
	 * REMOVE NOTIFICATION
	 * ======================================================
	 */

	const removeNotification = () => {
		setNotification(null);
		setNotificationAnimation("enter");

		removeNotificationTimeoutRef.current =
			null;
	};

	/*
	 * ======================================================
	 * START NOTIFICATION EXIT
	 * ======================================================
	 */

	const startNotificationExit = () => {
		if (notificationAnimation === "exit") {
			return;
		}

		setNotificationAnimation("exit");

		removeNotificationTimeoutRef.current =
			setTimeout(() => {
				removeNotification();
			}, 900);
	};

	/*
	 * ======================================================
	 * SHOW NOTIFICATION
	 * ======================================================
	 */

	const showNotification = (
		type,
		message,
		action = null
	) => {
		/*
		 * Clear previous timers.
		 */
		if (notificationTimeoutRef.current) {
			clearTimeout(
				notificationTimeoutRef.current
			);

			notificationTimeoutRef.current =
				null;
		}

		if (
			removeNotificationTimeoutRef.current
		) {
			clearTimeout(
				removeNotificationTimeoutRef.current
			);

			removeNotificationTimeoutRef.current =
				null;
		}

		/*
		 * Show notification.
		 */
		setNotification({
			type,
			message,
			action,
		});

		/*
		 * Start from the bottom.
		 */
		setNotificationAnimation("enter");

		/*
		 * After 3.5 seconds,
		 * start the exit animation.
		 */
		notificationTimeoutRef.current =
			setTimeout(() => {
				startNotificationExit();
			}, 3500);
	};

	/*
	 * ======================================================
	 * DISMISS NOTIFICATION
	 * ======================================================
	 */

	const dismissNotification = () => {
		if (notificationTimeoutRef.current) {
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
	 * DELETE
	 * ======================================================
	 */

	const handleDelete = async (id) => {
		return await deletePost(id);
	};

	/*
	 * ======================================================
	 * LOADING
	 * ======================================================
	 */

	const isLoading =
		authLoading ||
		(user && userPostsLoading);

	/*
	 * ======================================================
	 * LOADING SCREEN
	 * ======================================================
	 */

	if (isLoading) {
		return (
			<main className="min-h-screen bg-background pb-16 pt-8">
				<section className="container mx-auto px-4">
					<header className="flex items-center gap-2 mb-6">
						<span className="w-9 h-9 rounded-xl bg-gradient-warm flex items-center justify-center text-white text-lg shadow-glow">
							📝
						</span>

						<section>
							<h2 className="text-xl font-bold leading-tight">
								My Posts
							</h2>

							<p className="text-sm text-muted-foreground">
								Dogs you shared this session
							</p>
						</section>
					</header>

					<article className="text-center py-20">
						<span className="text-4xl mb-4 animate-pulse">
							🐾
						</span>

						<p className="text-muted-foreground">
							Loading your posts...
						</p>
					</article>
				</section>
			</main>
		);
	}

	/*
	 * ======================================================
	 * NOT LOGGED IN
	 * ======================================================
	 */

	if (!user) {
		return (
			<main className="min-h-screen bg-background pb-16 pt-8">
				<section className="container mx-auto px-4">
					<header className="flex items-center gap-2 mb-6">
						<span className="w-9 h-9 rounded-xl bg-gradient-warm flex items-center justify-center text-white text-lg shadow-glow">
							📝
						</span>

						<section>
							<h2 className="text-xl font-bold leading-tight">
								My Posts
							</h2>

							<p className="text-sm text-muted-foreground">
								Dogs you shared this session
							</p>
						</section>
					</header>

					<article className="text-center py-20">
						<span className="text-5xl mb-4">
							🐕
						</span>

						<h3 className="text-xl font-bold mb-2">
							Log in to manage your posts
						</h3>

						<p className="text-muted-foreground mb-6">
							Sign in to share a pup and see
							your posts here.
						</p>

						<Link
							to="/login"
							state={{ from: "/add" }}
							className="inline-flex px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-glow hover:-translate-y-0.5 transition-bounce"
						>
							Log in to share your first pup
						</Link>
					</article>
				</section>
			</main>
		);
	}

	/*
	 * ======================================================
	 * MAIN PAGE
	 * ======================================================
	 */

	return (
		<main className="min-h-screen bg-background pb-16 pt-8">
			<section className="container mx-auto px-4">
				<header className="flex items-center gap-2 mb-6">
					<span className="w-9 h-9 rounded-xl bg-gradient-warm flex items-center justify-center text-white text-lg shadow-glow">
						📝
					</span>

					<section>
						<h2 className="text-xl font-bold leading-tight">
							My Posts
						</h2>

						<p className="text-sm text-muted-foreground">
							Dogs you shared this session
						</p>
					</section>
				</header>

				{userPosts.length === 0 ? (
					<article className="text-center py-20">
						<span className="text-5xl mb-4">
							🐕
						</span>

						<h3 className="text-xl font-bold mb-2">
							No posts yet
						</h3>

						<p className="text-muted-foreground mb-6">
							You haven't uploaded any dogs yet!
						</p>

						<Link
							to="/add"
							className="inline-flex px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-glow hover:-translate-y-0.5 transition-bounce"
						>
							Share your first pup
						</Link>
					</article>
				) : (
					<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{userPosts.map((post) => (
							<MyPostCard
								key={post.id}
								post={post}
								onEdit={setEditingPost}
								onDelete={handleDelete}
								onOpen={setSelectedPost}
								showNotification={
									showNotification
								}
							/>
						))}
					</section>
				)}
			</section>

			{/* ==================================================
			    EDIT POST
			    ================================================== */}

			{editingPost && (
				<EditPostForm
					post={editingPost}
					onClose={() =>
						setEditingPost(null)
					}
					onSave={updatePost}
					showNotification={
						showNotification
					}
				/>
			)}

			{/* ==================================================
			    POST DETAILS
			    ================================================== */}

			<PostDetailsModal
				post={selectedPost}
				open={!!selectedPost}
				onClose={() =>
					setSelectedPost(null)
				}
				isMyPost
				onEdit={(post) => {
					setSelectedPost(null);
					setEditingPost(post);
				}}
				onDelete={async (id) => {
					const result =
						await handleDelete(id);

					if (!result?.error) {
						setSelectedPost(null);

						showNotification(
							"delete-success",
							"Aww... your post is gone. We'll miss it! 🐶💔"
						);
					} else {
						showNotification(
							"error",
							result.error?.message ||
								"Couldn't delete the post. Please try again."
						);
					}

					return result;
				}}
			/>

			{/* ==================================================
			    NOTIFICATION
			    ================================================== */}

			{notification && (
				<div className="fixed bottom-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
					<div
						className={`
							pointer-events-auto
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
							notification={notification}
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
