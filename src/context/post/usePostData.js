import {
    useCallback,
    useEffect,
    useState,
} from "react";

import { supabase } from "@/lib/supabase";

import { processImage } from "@/utils/imageUtils";

import {
    uploadImage,
    deleteImage,
} from "@/services/cloudinary.js";

import {
    POSTS_PER_PAGE,
    fetchTopPosts,
    fetchInitialFreshPosts,
    fetchMoreFreshPosts,
    fetchUserPosts,
    insertPost,
    updatePostById,
    fetchPostImage,
    deletePostById,
} from "./postQueries";

import {
    getPostCursor,
    mergeUniquePosts,
    prependUniquePost,
    replacePost,
    removePost,
} from "./postHelpers";

export const usePostData = ({
    user,
    authLoading,
}) => {
    /* Home feed state. */

    const [posts, setPosts] = useState([]);

    const [topPosts, setTopPosts] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [loadingMore, setLoadingMore] =
        useState(false);

    const [hasMore, setHasMore] =
        useState(true);

    /* Cursor for the oldest loaded Fresh Pup. */

    const [freshCursor, setFreshCursor] =
        useState(null);

    /* Current user's posts. */

    const [userPosts, setUserPosts] =
        useState([]);

    const [loadedUserId, setLoadedUserId] =
        useState(null);

    /* Refresh the global Top Dogs list. */

    const refreshTopPosts = useCallback(
        async () => {
            const {
                data,
                error,
            } = await fetchTopPosts();

            if (error) {
                return {
                    data: [],
                    error,
                };
            }

            const safeTopPosts = data || [];

            setTopPosts(safeTopPosts);

            return {
                data: safeTopPosts,
                error: null,
            };
        },
        []
    );

    /*
     * ======================================================
     * INITIAL HOME LOAD
     * ======================================================
     */

    useEffect(() => {
        let cancelled = false;

        const fetchInitialPosts =
            async () => {
                setLoading(true);

                setPosts([]);
                setTopPosts([]);
                setFreshCursor(null);
                setHasMore(true);

                /* Load the global Top 3. */

                const {
                    data: fetchedTopPosts,
                    error: topPostsError,
                } =
                    await fetchTopPosts();

                if (cancelled) return;

                if (topPostsError) {
                    setTopPosts([]);
                } else {
                    setTopPosts(
                        fetchedTopPosts || []
                    );
                }

                /* Load the first Fresh Pups page. */

                const {
                    data: fetchedFreshPosts,
                    error: freshPostsError,
                } =
                    await fetchInitialFreshPosts();

                if (cancelled) return;

                if (freshPostsError) {
                    setPosts([]);
                    setHasMore(false);
                    setFreshCursor(null);
                } else {
                    const freshData =
                        fetchedFreshPosts || [];

                    setPosts(freshData);

                    /* Check whether an older page exists. */

                    if (
                        freshData.length <
                        POSTS_PER_PAGE
                    ) {
                        setHasMore(false);
                    } else {
                        const lastPost =
                            freshData[
                                freshData.length -
                                1
                            ];

                        const {
                            data: nextPostCheck,
                            error: nextPostError,
                        } =
                            await fetchMoreFreshPosts(
                                lastPost.created_at,
                                lastPost.id
                            );

                        if (cancelled) return;

                        if (nextPostError) {
                            setHasMore(false);
                        } else {
                            setHasMore(
                                (
                                    nextPostCheck ||
                                    []
                                ).length > 0
                            );
                        }
                    }

                    /* Save the last loaded post as the cursor. */

                    setFreshCursor(
                        getPostCursor(freshData)
                    );
                }

                if (!cancelled) {
                    setLoading(false);
                }
            };

        fetchInitialPosts();

        return () => {
            cancelled = true;
        };
    }, []);

    /* Load the next Fresh Pups page. */

    const loadMorePosts =
        useCallback(async () => {
            if (
                loadingMore ||
                !hasMore ||
                !freshCursor
            ) {
                return {
                    data: [],
                    error: null,
                };
            }

            setLoadingMore(true);

            try {
                const {
                    data,
                    error,
                } =
                    await fetchMoreFreshPosts(
                        freshCursor.created_at,
                        freshCursor.id
                    );

                if (error) {
                    return {
                        data: [],
                        error,
                    };
                }

                const freshData =
                    data || [];

                if (
                    freshData.length === 0
                ) {
                    setHasMore(false);

                    return {
                        data: [],
                        error: null,
                    };
                }

                setPosts((currentPosts) =>
                    mergeUniquePosts(
                        currentPosts,
                        freshData
                    )
                );

                setFreshCursor(
                    getPostCursor(freshData)
                );

                setHasMore(
                    freshData.length ===
                    POSTS_PER_PAGE
                );

                return {
                    data: freshData,
                    error: null,
                };
            } catch (error) {
                return {
                    data: [],
                    error,
                };
            } finally {
                setLoadingMore(false);
            }
        }, [
            loadingMore,
            hasMore,
            freshCursor,
        ]);

    /* Load the current user's posts. */

    useEffect(() => {
        if (authLoading || !user) {
            return;
        }

        let cancelled = false;

        const loadUserPosts = async () => {
            const {
                data,
                error,
            } = await fetchUserPosts(
                user.id
            );

            if (cancelled) return;

            if (error) {
                setUserPosts([]);
            } else {
                setUserPosts(data || []);
            }

            setLoadedUserId(user.id);
        };

        loadUserPosts();

        return () => {
            cancelled = true;
        };
    }, [user, authLoading]);

    const isUserPostsLoading =
        authLoading ||
        Boolean(
            user &&
            loadedUserId !== user.id
        );

    /* Create a post and update local lists. */

    const addPost = useCallback(
        async (post) => {
            if (!user) {
                return {
                    data: null,
                    error: new Error(
                        "You must be logged in to create a post"
                    ),
                };
            }

            try {
                const {
                    image,
                    ...postData
                } = post;

                let imageUrl = null;
                let imagePublicId = null;

                /* Upload the image when one is provided. */

                if (image) {
                    const optimizedImage =
                        await processImage(
                            image
                        );

                    const cloudinaryResult =
                        await uploadImage(
                            optimizedImage,
                            supabase
                        );

                    imageUrl =
                        cloudinaryResult.imageUrl;

                    imagePublicId =
                        cloudinaryResult.imagePublicId;
                }

                /* Insert the post into Supabase. */

                const {
                    data,
                    error,
                } = await insertPost({
                    ...postData,
                    user_id: user.id,
                    votes: 0,
                    image_url: imageUrl,
                    image_public_id:
                        imagePublicId,
                });

                if (error) {
                    return {
                        data: null,
                        error,
                    };
                }

                /* Update local lists; realtime duplicate checks prevent repeats. */

                setPosts((currentPosts) =>
                    prependUniquePost(
                        currentPosts,
                        data
                    )
                );

                setUserPosts((currentPosts) =>
                    prependUniquePost(
                        currentPosts,
                        data
                    )
                );

                await refreshTopPosts();

                return {
                    data,
                    error: null,
                };
            } catch (error) {
                return {
                    data: null,
                    error,
                };
            }
        },
        [user, refreshTopPosts]
    );

    /* Update a post and its image when needed. */

    const updatePost =
        useCallback(
            async (id, updates) => {
                if (!user) {
                    return {
                        data: null,
                        error: new Error(
                            "You must be logged in to update a post"
                        ),
                    };
                }

                try {
                    const {
                        image,
                        ...postData
                    } = updates;

                    /* Update fields without replacing the image. */

                    if (!image) {
                        const {
                            data,
                            error,
                        } =
                            await updatePostById(
                                id,
                                user.id,
                                postData
                            );

                        if (error) {
                            return {
                                data: null,
                                error,
                            };
                        }

                        setPosts(
                            (
                                currentPosts
                            ) =>
                                replacePost(
                                    currentPosts,
                                    data
                                )
                        );

                        setUserPosts(
                            (
                                currentPosts
                            ) =>
                                replacePost(
                                    currentPosts,
                                    data
                                )
                        );

                        await refreshTopPosts();

                        return {
                            data,
                            error: null,
                        };
                    }

                    /* Replace the image and update the post. */

                    const {
                        data: existingPost,
                        error: fetchError,
                    } =
                        await fetchPostImage(
                            id,
                            user.id
                        );

                    if (fetchError) {
                        return {
                            data: null,
                            error: fetchError,
                        };
                    }

                    const oldImagePublicId =
                        existingPost?.image_public_id ||
                        null;

                    /* Upload the replacement image. */

                    const optimizedImage =
                        await processImage(
                            image
                        );

                    const cloudinaryResult =
                        await uploadImage(
                            optimizedImage,
                            supabase
                        );

                    const newImageUrl =
                        cloudinaryResult.imageUrl;

                    const newImagePublicId =
                        cloudinaryResult.imagePublicId;

                    /* Save the replacement image metadata. */

                    const {
                        data,
                        error,
                    } =
                        await updatePostById(
                            id,
                            user.id,
                            {
                                ...postData,
                                image_url:
                                    newImageUrl,
                                image_public_id:
                                    newImagePublicId,
                            }
                        );

                    if (error) {
                        /* Remove the new image if the update failed. */

                        try {
                            await deleteImage(
                                newImagePublicId,
                                supabase
                            );
                        } catch (cleanupError) {
                            console.error(
                                "Failed to clean up newly uploaded image:",
                                cleanupError
                            );
                        }

                        return {
                            data: null,
                            error,
                        };
                    }

                    /* Remove the old image after a successful update. */

                    if (
                        oldImagePublicId &&
                        oldImagePublicId !==
                        newImagePublicId
                    ) {
                        try {
                            await deleteImage(
                                oldImagePublicId,
                                supabase
                            );
                        } catch (deleteError) {
                            console.error(
                                "Post updated, but failed to delete old Cloudinary image:",
                                deleteError
                            );
                        }
                    }

                    setPosts(
                        (currentPosts) =>
                            replacePost(
                                currentPosts,
                                data
                            )
                    );

                    setUserPosts(
                        (currentPosts) =>
                            replacePost(
                                currentPosts,
                                data
                            )
                    );

                    await refreshTopPosts();

                    return {
                        data,
                        error: null,
                    };
                } catch (error) {
                    return {
                        data: null,
                        error,
                    };
                }
            },
            [user, refreshTopPosts]
        );

    /* Delete a post and its image. */

    const deletePost =
        useCallback(
            async (id) => {
                if (!user) {
                    return {
                        error: new Error(
                            "You must be logged in to delete a post"
                        ),
                    };
                }

                try {
                    const {
                        data: post,
                        error: fetchError,
                    } =
                        await fetchPostImage(
                            id,
                            user.id
                        );

                    if (fetchError) {
                        return {
                            error: fetchError,
                        };
                    }

                    /* Delete the Cloudinary image first. */

                    if (
                        post?.image_public_id
                    ) {
                        await deleteImage(
                            post.image_public_id,
                            supabase
                        );
                    }

                    /* Delete the database row. */

                    const {
                        error,
                    } =
                        await deletePostById(
                            id,
                            user.id
                        );

                    if (error) {
                        return {
                            error,
                        };
                    }

                    /* Remove the post from local lists. */

                    setPosts(
                        (currentPosts) =>
                            removePost(
                                currentPosts,
                                id
                            )
                    );

                    setUserPosts(
                        (currentPosts) =>
                            removePost(
                                currentPosts,
                                id
                            )
                    );

                    setTopPosts(
                        (currentTopPosts) =>
                            removePost(
                                currentTopPosts,
                                id
                            )
                    );

                    await refreshTopPosts();

                    return {
                        error: null,
                    };
                } catch (error) {
                    return {
                        error,
                    };
                }
            },
            [user, refreshTopPosts]
        );

    /* Optimistically update vote counts in local lists. */

    const applyVoteDelta = useCallback(
        (postId, delta) => {
            if (!postId || !delta) {
                return;
            }

            /* Update Fresh Pups. */

            setPosts((currentPosts) =>
                currentPosts.map((post) => {
                    if (post.id !== postId) {
                        return post;
                    }

                    return {
                        ...post,
                        votes: Math.max(
                            0,
                            (post.votes || 0) +
                            delta
                        ),
                    };
                })
            );

            /* Update Top Dogs. */

            setTopPosts((currentTopPosts) =>
                currentTopPosts.map((post) => {
                    if (post.id !== postId) {
                        return post;
                    }

                    return {
                        ...post,
                        votes: Math.max(
                            0,
                            (post.votes || 0) +
                            delta
                        ),
                    };
                })
            );

            /* Update My Posts. */

            setUserPosts((currentPosts) =>
                currentPosts.map((post) => {
                    if (post.id !== postId) {
                        return post;
                    }

                    return {
                        ...post,
                        votes: Math.max(
                            0,
                            (post.votes || 0) +
                            delta
                        ),
                    };
                })
            );
        },
        []
    );

    return {
        posts,
        topPosts,

        loading,
        loadingMore,
        hasMore,

        freshCursor,

        userPosts,
        userPostsLoading:
            isUserPostsLoading,

        setPosts,
        setTopPosts,
        setUserPosts,

        loadMorePosts,
        refreshTopPosts,

        addPost,
        updatePost,
        deletePost,

        applyVoteDelta,
    };
};
