import { WelcomeBanner } from "@/components/WelcomeBanner";
import { PostCard } from "@/components/PostCard";
import { TopDogs } from "@/components/TopDogs";
import { useState } from "react";

import { DealsBar } from "@/components/layout/DealsBar";

import stasiuImg from "@/assets/Snapchat-353224242.jpg";

// Dummy data so you can see the layout immediately
const dummyPosts = [
  {
    id: "1",
    dog_name: "Stasiu",
    owner_name: "Kaja",
    location: "Poland",
    description: "Best doggy ever! Loves belly rubs and stealing socks.",
   image_url: stasiuImg,
    votes: 1000,
  },
  {
    id: "2",
    dog_name: "Bella",
    owner_name: "Ahmed",
    location: "Cairo, Egypt",
    description: "A cheeky golden who steals socks for fun...",
    image_url: "https://th.bing.com/th/id/R.66853f8606bff6b73e2aad4407b5be0a?rik=fVW4gRYxQKxxWA&riu=http%3a%2f%2fdancewithizzy.squarespace.com%2fstorage%2fanimals-pictures-cute-dogs.jpg%3f__SQUARESPACE_CACHEVERSION%3d1298065073623&ehk=hVAlG8uJlQzsUa%2fVT9%2blFtLjSfwczxR%2fNhLbKDNRB5w%3d&risl=&pid=ImgRaw&r=0",
    votes: 42,
  },
  {
    id: "3",
    dog_name: "Fluffy",
    owner_name: "Sarah",
    location: "Lisbon, Portugal",
    description: "Tiny but mighty. Professional cuddler.",
    image_url: "https://tse2.mm.bing.net/th/id/OIP.0_4SmHo9IqUW2m7ppN7D3wHaEo?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
    votes: 28,
  },
  {
    id: "4",
    dog_name: "Max",
    owner_name: "Tom",
    location: "Paris, France",
    description: "Loves park walks and chasing squirrels.",
    image_url: "https://images.pexels.com/photos/19024664/pexels-photo-19024664.jpeg?cs=srgb&dl=pexels-csibeman-19024664.jpg&fm=jpg",
    votes: 15,
  },
];

export default function Home() {
  const [posts, setPosts] = useState(dummyPosts);

  const handleVote = (id, newVotes) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, votes: newVotes } : p))
    );
  };

  // Sort by votes for Top Dogs, by newest for feed
  const topDogs = [...posts].sort((a, b) => b.votes - a.votes).slice(0, 3);
  const freshPups = [...posts].sort((a, b) => b.id.localeCompare(a.id));

  return (
    <div className="min-h-screen bg-background pb-16">
      <WelcomeBanner />

      <div className="container mx-auto px-4">
        {/* Top Dogs Section */}
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

        {/* Fresh Pups Section */}
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
            {freshPups.map((post) => (
              <PostCard key={post.id} post={post} onVoted={handleVote} />
            ))}

              <DealsBar />
          </div>
        </div>
      </div>
    </div>
  );
}