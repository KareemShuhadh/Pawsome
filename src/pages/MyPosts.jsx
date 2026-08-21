import { MyPostCard } from "@/components/MyPostCard";
import { EditPostForm } from "@/components/EditPostForm";
import { PostDetailsModal } from "@/components/PostDetailsModal";
import { usePosts } from "@/context/PostContext";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function MyPosts() {
	const [editingPost, setEditingPost] =
		useState(null);

	const [selectedPost, setSelectedPost] =
		useState(null);

	const {
		user,
		loading: authLoading,
	} = useAuth();

	const {
		userPosts,
		userPostsLoading,
		deletePost,
		updatePost,
	} = usePosts();

	const handleDelete = async (id) => {
		return await deletePost(id);
	};

	/*
	 * One loading state.
	 *
	 * We wait for both:
	 *
	 * 1. Authentication
	 * 2. User posts
	 */
	const isLoading =
		authLoading ||
		(user && userPostsLoading);

	/*
	 * Loading screen
	 */
	if (isLoading) {
		return (
			<div className="min-h-screen bg-background pb-16 pt-8">
				<div className="container mx-auto px-4">
					<div className="flex items-center gap-2 mb-6">
						<div className="w-9 h-9 rounded-xl bg-gradient-warm flex items-center justify-center text-white text-lg shadow-glow">
							📝
						</div>

						<div>
							<h2 className="text-xl font-bold leading-tight">
								My Posts
							</h2>

							<p className="text-sm text-muted-foreground">
								Dogs you shared this session
							</p>
						</div>
					</div>

					<div className="text-center py-20">
						<div className="text-4xl mb-4 animate-pulse">
							🐾
						</div>

						<p className="text-muted-foreground">
							Loading your posts...
						</p>
					</div>
				</div>
			</div>
		);
	}

	/*
	 * Authentication has finished.
	 *
	 * If there is no user, show the login screen.
	 */
	if (!user) {
		return (
			<div className="min-h-screen bg-background pb-16 pt-8">
				<div className="container mx-auto px-4">
					<div className="flex items-center gap-2 mb-6">
						<div className="w-9 h-9 rounded-xl bg-gradient-warm flex items-center justify-center text-white text-lg shadow-glow">
							📝
						</div>

						<div>
							<h2 className="text-xl font-bold leading-tight">
								My Posts
							</h2>

							<p className="text-sm text-muted-foreground">
								Dogs you shared this session
							</p>
						</div>
					</div>

					<div className="text-center py-20">
						<div className="text-5xl mb-4">
							🐕
						</div>

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
					</div>
				</div>
			</div>
		);
	}

	/*
	 * At this point:
	 *
	 * - Auth has finished
	 * - User exists
	 * - User posts have finished loading
	 */
	return (
		<div className="min-h-screen bg-background pb-16 pt-8">
			<div className="container mx-auto px-4">
				<div className="flex items-center gap-2 mb-6">
					<div className="w-9 h-9 rounded-xl bg-gradient-warm flex items-center justify-center text-white text-lg shadow-glow">
						📝
					</div>

					<div>
						<h2 className="text-xl font-bold leading-tight">
							My Posts
						</h2>

						<p className="text-sm text-muted-foreground">
							Dogs you shared this session
						</p>
					</div>
				</div>

				{userPosts.length === 0 ? (
					<div className="text-center py-20">
						<div className="text-5xl mb-4">
							🐕
						</div>

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
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{userPosts.map((post) => (
							<MyPostCard
								key={post.id}
								post={post}
								onEdit={setEditingPost}
								onDelete={handleDelete}
								onOpen={setSelectedPost}
							/>
						))}
					</div>
				)}
			</div>

			{/* Edit Post Modal */}
			{editingPost && (
				<EditPostForm
					post={editingPost}
					onClose={() =>
						setEditingPost(null)
					}
					onSave={updatePost}
				/>
			)}

			{/* Post Details Modal */}
			<PostDetailsModal
				post={selectedPost}
				open={!!selectedPost}
				onClose={() =>
					setSelectedPost(null)
				}
				isMyPost
				onEdit={(post) => {
					/*
					 * Close the details modal first,
					 * then open the edit form.
					 */
					setSelectedPost(null);
					setEditingPost(post);
				}}
				onDelete={async (id) => {
					const result =
						await handleDelete(id);

					/*
					 * Only close the modal if
					 * deletion succeeded.
					 */
					if (!result?.error) {
						setSelectedPost(null);
					}

					return result;
				}}
			/>
		</div>
	);
}