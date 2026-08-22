import { useParams, useNavigate } from "react-router-dom";
import { Heart, MapPin, ArrowLeft } from "lucide-react";
import { useState } from "react";

// Same dummy data for now
const dummyPosts = [
	{
		id: "1",
		dog_name: "Stasiu",
		owner_name: "Kaja",
		location: "Poland",
		description:
			"Best doggy ever! Loves belly rubs and stealing socks. Always ready for adventure and treats.",
		image_url:
			"https://hips.hearstapps.com/aada87eb7c5759b5c9610ce497ee2445153497a6.jpg",
		votes: 1003,
	},
	{
		id: "2",
		dog_name: "Bella",
		owner_name: "Ahmed",
		location: "Cairo, Egypt",
		description:
			"A cheeky golden who steals socks for fun. Bella loves belly rubs, long walks in the park, and chasing butterflies.",
		image_url:
			"https://hips.hearstapps.com/aada87eb7c5759b5c9610ce497ee2445153497a6.jpg",
		votes: 42,
	},
];

export default function DogDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [posts] = useState(dummyPosts);

	const post = posts.find((p) => p.id === id);

	if (!post) {
		return (
			<main className="min-h-screen flex items-center justify-center">
				<section className="text-center">
					<h1 className="text-6xl font-bold text-primary mb-4">
						404
					</h1>

					<p className="text-muted-foreground mb-6">
						This dog ran away! 🐕
					</p>

					<button
						onClick={() => navigate("/")}
						className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-bold shadow-glow hover:-translate-y-0.5 transition-bounce"
					>
						Back to feed
					</button>
				</section>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-background pb-16">
			<section className="container mx-auto px-4 pt-6">
				<button
					onClick={() => navigate("/")}
					className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-bold mb-6 transition-smooth"
				>
					<ArrowLeft className="w-4 h-4" /> Back to feed
				</button>

				<img
					src={post.image_url}
					alt={post.dog_name}
					className="w-full h-80 md:h-96 object-cover rounded-3xl shadow-card mb-8"
				/>

				<article className="max-w-2xl mx-auto bg-card rounded-2xl p-6 md:p-8 shadow-soft border border-border">
					<header className="flex items-start justify-between gap-4 mb-4">
						<h1 className="text-3xl md:text-4xl font-bold">
							{post.dog_name}
						</h1>

						<button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold shadow-glow">
							<Heart className="w-5 h-5 fill-current" />
							{post.votes}
						</button>
					</header>

					<aside className="flex flex-wrap gap-4 text-muted-foreground font-semibold mb-6">
						<span>
							👤 with {post.owner_name}
						</span>

						<span className="flex items-center gap-1">
							<MapPin className="w-4 h-4" />
							{post.location}
						</span>
					</aside>

					<p className="text-lg leading-relaxed text-foreground/90 mb-8">
						{post.description}
					</p>

					<footer className="flex gap-3 pt-4 border-t border-border">
						<button className="px-5 py-2.5 rounded-xl border-2 border-border font-bold hover:bg-secondary transition-smooth">
							✏️ Edit
						</button>

						<button className="px-5 py-2.5 rounded-xl border-2 border-destructive/30 text-destructive font-bold hover:bg-destructive/10 transition-smooth">
							🗑️ Delete
						</button>
					</footer>
				</article>
			</section>
		</main>
	);
}