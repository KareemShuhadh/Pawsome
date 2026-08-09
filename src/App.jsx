import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import Home from "@/pages/Home";
import AddDog from "@/pages/AddDog";
import DogDetail from "@/pages/DogDetail";
import MyPosts from "@/pages/MyPosts";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddDog />} />
        <Route path="/dog/:id" element={<DogDetail />} />
        <Route path="/my-posts" element={<MyPosts />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;