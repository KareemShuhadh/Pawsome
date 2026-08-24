import {
	createContext,
	useContext,
} from "react";

import { useAuth } from "@/context/AuthContext";

import { usePostData } from "./post/usePostData";
import { usePostRealtime } from "./post/usePostRealtime";

const PostContext = createContext(null);

export const PostProvider = ({
	children,
}) => {
	const {
		user,
		loading: authLoading,
	} = useAuth();

	const postData = usePostData({
		user,
		authLoading,
	});

	usePostRealtime({
		userId: user?.id,

		setPosts: postData.setPosts,
		setTopPosts: postData.setTopPosts,
		setUserPosts: postData.setUserPosts,

		refreshTopPosts:
			postData.refreshTopPosts,
	});

	return (
		<PostContext.Provider
			value={{
				posts: postData.posts,

				topPosts: postData.topPosts,

				loading: postData.loading,

				loadingMore:
					postData.loadingMore,

				hasMore: postData.hasMore,

				loadMorePosts:
					postData.loadMorePosts,

				refreshTopPosts:
					postData.refreshTopPosts,

				userPosts:
					postData.userPosts,

				userPostsLoading:
					postData.userPostsLoading,

				addPost: postData.addPost,

				updatePost:
					postData.updatePost,

				deletePost:
					postData.deletePost,

				/*
				 * Kept for compatibility.
				 *
				 * Vote synchronization is handled
				 * by PostgreSQL + Realtime.
				 */
				applyVoteDelta:
					postData.applyVoteDelta,
			}}
		>
			{children}
		</PostContext.Provider>
	);
};

export const usePosts = () => {
	const context = useContext(PostContext);

	if (!context) {
		throw new Error(
			"usePosts must be used inside PostProvider"
		);
	}

	return context;
};
