import { useState } from "react";

import { WelcomeBanner } from "@/components/WelcomeBanner";
import { PostCard } from "@/components/PostCard";
import { TopDogs } from "@/components/TopDogs";
import { PostDetailsModal } from "@/components/PostDetailsModal";

import { usePosts } from "@/context/PostContext";

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

	const handlePostClick = (post) => {
		setSelectedPost(post);
	};

	const handleCloseDetails = () => {
		setSelectedPost(null);
	};

	if (loading) {
		return (
			<main className="min-h-screen flex items-center justify-center">
				<p className="text-2xl font-bold text-primary">
					Loading dogs... 🐕
				</p>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-background pb-16">
			<WelcomeBanner />

			<section className="container mx-auto px-4">
				{/* ================================
				    Top Dogs
				    ================================ */}
				<section className="mt-8 mb-4">
					<header className="flex items-center gap-2 mb-4">
						<span className="w-9 h-9 rounded-xl bg-gradient-warm flex items-center justify-center text-white text-lg shadow-glow">
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
				<section className="mt-10 mb-4">
					<header className="flex items-center gap-2 mb-6">
						<span className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white text-lg">
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
						<section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
						<section className="text-center py-12 text-muted-foreground">
							<span className="text-4xl mb-3 block">
								🐶
							</span>

							<p className="font-semibold">
								No fresh pups yet.
							</p>

							<p className="text-sm mt-1">
								Be the first to add one!
							</p>
						</section>
					)}

					{/* ================================
					    Load More
					    ================================ */}
					{hasMore && (
						<section className="flex justify-center mt-8">
							<button
								type="button"
								onClick={loadMorePosts}
								disabled={loadingMore}
								className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold shadow-soft hover:-translate-y-0.5 transition-bounce disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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
				onClose={handleCloseDetails}
			/>
		</main>
	);
}