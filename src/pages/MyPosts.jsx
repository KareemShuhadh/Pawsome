import { PostCard } from "@/components/PostCard";
import { useState } from "react";

const dummyMyPosts = [
  {
    id: "2",
    dog_name: "Bella",
    owner_name: "Ahmed",
    location: "Cairo, Egypt",
    description: "A cheeky golden who steals socks for fun...",
    image_url: "https://hips.hearstapps.com/aada87eb7c5759b5c9610ce497ee2445153497a6.jpg",
    votes: 42,
  },
];

export default function MyPosts() {
  const [posts, setPosts] = useState(dummyMyPosts);

  const handleVote = (id, newVotes) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, votes: newVotes } : p))
    );
  };

  return (
    <div className="min-h-screen bg-background pb-16 pt-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-warm flex items-center justify-center text-white text-lg shadow-glow">
            📝
          </div>
          <div>
            <h2 className="text-xl font-bold leading-tight">My Posts</h2>
            <p className="text-sm text-muted-foreground">Dogs you shared this session</p>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🐕</div>
            <h3 className="text-xl font-bold mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-6">You haven't uploaded any dogs yet!</p>
            <a 
              href="/add" 
              className="inline-flex px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-glow hover:-translate-y-0.5 transition-bounce"
            >
              Share your first pup
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <div key={post.id} className="relative">
                <PostCard post={post} onVoted={handleVote} />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur border border-border text-sm font-bold hover:bg-secondary transition-smooth shadow-soft">
                    ✏️ Edit
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur border border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 transition-smooth shadow-soft">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}