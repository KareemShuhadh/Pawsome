import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, Loader2, ImagePlus } from "lucide-react";

// TODO: Create these later when we wire up Supabase & Cloudinary
// import { supabase } from "@/lib/supabase";

export const AddDogForm = ({ onCreated }) => {
  const [dogName, setDogName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Please choose an image file");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      alert("Image must be under 8MB");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const reset = () => {
    setDogName("");
    setOwnerName("");
    setLocation("");
    setDescription("");
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // Simple validation (no Zod schema yet)
    if (!dogName.trim() || !ownerName.trim() || !location.trim()) {
      alert("Please fill in all required fields");
      return;
    }
    if (!file) {
      alert("Please add a photo of your dog");
      return;
    }

    setSubmitting(true);

    try {
      // TODO: Step 1 - Upload image to Cloudinary
      // const formData = new FormData();
      // formData.append("file", file);
      // formData.append("upload_preset", "your_preset");
      // const res = await fetch("https://api.cloudinary.com/v1_1/yourname/image/upload", {
      //   method: "POST",
      //   body: formData
      // });
      // const cloudData = await res.json();
      // const imageUrl = cloudData.secure_url;

      // TODO: Step 2 - Save to Supabase
      // const { error } = await supabase.from("posts").insert({
      //   dog_name: dogName,
      //   owner_name: ownerName,
      //   location,
      //   description: description || null,
      //   image_url: imageUrl,
      //   votes: 0
      // });
      // if (error) throw error;

      // Temporary: Just log and reset
      console.log("Would upload:", { dogName, ownerName, location, description, file });
      alert("Posted! (Supabase not connected yet)");
      
      reset();
      if (onCreated) onCreated();
    } catch (err) {
      console.error(err);
      alert("Couldn't post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6 md:p-8 shadow-card border-2 border-border/60 max-w-2xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold mb-1">Share your pup</h2>
      <p className="text-muted-foreground mb-6">It only takes a minute. No account needed.</p>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dog">Dog's name *</Label>
            <Input 
              id="dog" 
              value={dogName} 
              onChange={(e) => setDogName(e.target.value)} 
              maxLength={60} 
              placeholder="Biscuit" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner">Your name *</Label>
            <Input 
              id="owner" 
              value={ownerName} 
              onChange={(e) => setOwnerName(e.target.value)} 
              maxLength={60} 
              placeholder="Alex" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loc">Location *</Label>
          <Input 
            id="loc" 
            value={location} 
            onChange={(e) => setLocation(e.target.value)} 
            maxLength={80} 
            placeholder="Lisbon, Portugal" 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            maxLength={280} 
            rows={3}
            placeholder="A cheeky golden who steals socks for fun…"
          />
          <p className="text-xs text-muted-foreground text-right">{description.length}/280</p>
        </div>

        <div className="space-y-2">
          <Label>Photo *</Label>
          <label
            htmlFor="photo"
            className="flex flex-col items-center justify-center w-full min-h-[180px] rounded-2xl border-2 border-dashed border-border bg-muted/40 hover:bg-muted cursor-pointer transition-smooth overflow-hidden"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full max-h-72 object-cover" />
            ) : (
              <div className="text-center p-6">
                <ImagePlus className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload a photo</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — up to 8MB</p>
              </div>
            )}
            <input
              ref={fileRef} 
              id="photo" 
              type="file" 
              accept="image/*" 
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {/* Custom styled button since shadcn doesn't have "hero" variant */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-bold text-lg bg-gradient-warm text-primary-foreground shadow-glow hover:shadow-card hover:-translate-y-0.5 transition-bounce disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Posting…</>
          ) : (
            <><Upload className="w-5 h-5" /> Post my dog</>
          )}
        </button>
      </form>
    </Card>
  );
};