import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Heart, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// TODO: Create these helper files later
// import { hasVoted, markVoted } from "@/lib/voteTracker";
// import { supabase } from "@/lib/supabase";

export const PostCard = ({ post, featured, rank, onVoted }) => {
  // For now, use simple localStorage tracking until we create voteTracker.js
  const [voted, setVoted] = useState(() => {
    const votedPosts = JSON.parse(localStorage.getItem("pawtopia_votes") || "[]");
    return votedPosts.includes(post.id);
  });
  
  const [pulsing, setPulsing] = useState(false);
  const [busy, setBusy] = useState(false);

  const onVote = async () => {
    if (voted || busy) return;

    setBusy(true);
    setVoted(true); // optimistic update
    setPulsing(true);
    setTimeout(() => setPulsing(false), 400);

    // TODO: Replace with real Supabase call later
    // const { data, error } = await supabase
    //   .from("posts")
    //   .update({ votes: post.votes + 1 })
    //   .eq("id", post.id)
    //   .select();

    // For now, just mark as voted locally
    const votedPosts = JSON.parse(localStorage.getItem("pawtopia_votes") || "[]");
    votedPosts.push(post.id);
    localStorage.setItem("pawtopia_votes", JSON.stringify(votedPosts));

    // Call parent to update count in UI
    if (onVoted) {
      onVoted(post.id, post.votes + 1);
    }
    
    setBusy(false);
  };

  return (
    <Card
      className={cn(
        "group overflow-hidden border-2 border-border/60 shadow-soft hover:shadow-card transition-bounce hover:-translate-y-1 animate-float-up",
        featured && "border-primary/40 shadow-glow"
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {rank && (
          <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-warm text-primary-foreground font-bold shadow-glow text-sm">
            {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`} Top Dog
          </div>
        )}
        <img
          src={post.image_url}
          alt={`${post.dog_name}, a dog from ${post.location}`}
          loading="lazy"
          className="w-full h-full object-cover transition-smooth group-hover:scale-105"
        />
      </div>
      
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-2xl font-bold leading-tight">{post.dog_name}</h3>
          
          {/* Custom vote button — replaces shadcn Button with non-existent variants */}
          <button
            type="button"
            onClick={onVote}
            disabled={busy}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-bounce",
              voted 
                ? "bg-primary text-primary-foreground shadow-glow" 
                : "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground"
            )}
            aria-label={voted ? "You voted" : `Vote for ${post.dog_name}`}
          >
            <Heart 
              className={cn(
                "w-4 h-4", 
                voted && "fill-current", 
                pulsing && "animate-pop"
              )} 
            />
            <span className="tabular-nums">{post.votes}</span>
          </button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-2">
          with <span className="font-semibold text-foreground">{post.owner_name}</span>
        </p>
        
        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
          <MapPin className="w-3.5 h-3.5" /> {post.location}
        </p>
        
        {post.description && (
          <p className="text-sm text-foreground/80 leading-relaxed">{post.description}</p>
        )}
      </div>
    </Card>
  );
};