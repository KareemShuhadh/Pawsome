import { PostCard } from "./PostCard";

export const TopDogs = ({
	posts,
	onPostClick,
}) => {
	if (!posts || posts.length === 0) return null;

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
			{posts.map((post, index) => (
				<PostCard
					key={post.id}
					post={post}
					featured={true}
					rank={index + 1}
					onClick={onPostClick}
				/>
			))}
		</div>
	);
};