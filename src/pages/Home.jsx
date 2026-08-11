import { useState, useEffect } from "react";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { PostCard } from "@/components/PostCard";
import { TopDogs } from "@/components/TopDogs";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Define async function INSIDE the effect
    const loadPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    };

    loadPosts();
  }, []);

  const handleVote = (id, newVotes) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, votes: newVotes } : p))
    );
  };

  const topDogs = [...posts].sort((a, b) => b.votes - a.votes).slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-primary">Loading dogs... 🐕</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <WelcomeBanner />
      <div className="container mx-auto px-4">
        <div className="mt-8 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-warm flex items-center justify-center text-white text-lg shadow-glow">
              🏆
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">Top Dogs</h2>
              <p className="text-sm text-muted-foreground">The most-loved pups right now</p>
            </div>
          </div>
          <TopDogs posts={topDogs} onVoted={handleVote} />
        </div>

        <div className="mt-10 mb-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white text-lg">
              🐾
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">Fresh Pups</h2>
              <p className="text-sm text-muted-foreground">Newest dogs on Pawsome</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onVoted={handleVote} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}