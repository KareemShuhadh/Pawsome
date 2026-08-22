import heroDogs from "@/assets/hero-dogs.jpg";

export const WelcomeBanner = () => (
  <header className="relative overflow-hidden bg-gradient-hero">
    <section className="container mx-auto px-4 pt-12 pb-8 md:pt-20 md:pb-12 text-center">
      <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/80 backdrop-blur shadow-soft text-sm font-semibold text-primary mb-6">
        🐾 Post. Vote. Repeat.
      </p>

      <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground tracking-tight mb-4">
        Pawsome
      </h1>

      <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-8">
        Share your best pup. Vote for the goodest dogs on the internet.
      </p>

      <figure>
        <img
          src={heroDogs}
          alt="A row of cheerful cartoon dogs of many breeds peeking up"
          width={1536}
          height={640}
          className="mx-auto max-w-3xl w-full rounded-3xl shadow-card"
        />
      </figure>
    </section>
  </header>
);