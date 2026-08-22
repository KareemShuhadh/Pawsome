import { AddDogForm } from "@/components/AddDogForm";
import { useNavigate } from "react-router-dom";

export default function AddDog() {
  const navigate = useNavigate();

  const handleCreated = () => {
    navigate("/");
  };

  return (
    <main className="min-h-screen bg-gradient-soft pt-8 pb-16">
      <section className="container mx-auto px-4">
        <AddDogForm onCreated={handleCreated} />
      </section>
    </main>
  );
}