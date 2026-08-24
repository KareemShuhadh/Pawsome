import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { PostProvider } from "@/context/PostContext";
import { VoteProvider } from "@/context/VoteContext";
import { PromotionProvider } from "@/context/PromotionContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Navbar } from "@/components/Navbar";
import Home from "@/pages/Home";
import AddDog from "@/pages/AddDog";
import DogDetail from "@/pages/DogDetail";
import MyPosts from "@/pages/MyPosts";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <PromotionProvider>
            <PostProvider>
              <VoteProvider>
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/add" element={<AddDog />} />
                <Route path="/dog/:id" element={<DogDetail />} />
                <Route path="/my-posts" element={<MyPosts />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Routes>
              </VoteProvider>
            </PostProvider>
          </PromotionProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;