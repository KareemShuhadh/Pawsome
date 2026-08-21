import { useState, useRef } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

import {
  Upload,
  Loader2,
  ImagePlus,
} from "lucide-react";

import { usePosts } from "@/context/PostContext";
import { useAuth } from "@/context/AuthContext";

import { Notification } from "@/components/Notification";

export const AddDogForm = ({ onCreated }) => {
  const { addPost } = usePosts();
  const { user, loading: authLoading } = useAuth();

  const [dogName, setDogName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const [notification, setNotification] = useState(null);

  const fileRef = useRef(null);

  /*
   * Get the user's display name from
   * user metadata.
   */
  const displayName = user?.user_metadata?.["name"] || "";

  /*
   * Show a notification.
   */
  const showNotification = (type, message, action = null) => {
    setNotification({
      type,
      message,
      action,
    });
  };

  /*
   * Dismiss notification.
   */
  const dismissNotification = () => {
    setNotification(null);
  };

  /*
   * Handle image selection.
   */
  const handleFile = (f) => {
    if (!f) return;

    /*
     * Make sure the selected file is an image.
     */
    if (!f.type.startsWith("image/")) {
      showNotification(
        "photo",
        "Please choose an image file."
      );

      return;
    }

    /*
     * Maximum file size: 8MB.
     */
    if (f.size > 8 * 1024 * 1024) {
      showNotification(
        "photo",
        "Image must be under 8MB."
      );

      return;
    }

    /*
     * Clean up the previous preview URL.
     */
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(f);

    /*
     * Create a temporary preview URL.
     */
    const previewUrl = URL.createObjectURL(f);
    setPreview(previewUrl);

    /*
     * If the user fixed the photo problem,
     * remove the photo notification.
     */
    if (notification?.type === "photo") {
      setNotification(null);
    }
  };

  /*
   * Reset form.
   */
  const reset = () => {
    setDogName("");
    setOwnerName("");
    setLocation("");
    setDescription("");

    setFile(null);

    /*
     * Clean up temporary object URL.
     */
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);

    if (fileRef.current) {
      fileRef.current.value = "";
    }

    setNotification(null);
  };

  /*
   * Submit post.
   */
  const onSubmit = async (e) => {
    e.preventDefault();

    /*
     * Authentication is still being restored.
     *
     * Don't validate or submit yet.
     */
    if (authLoading) {
      return;
    }

    /*
     * Check authentication first.
     */
    if (!user) {
      showNotification(
        "login",
        "You need to log in before you can post a dog.",
        {
          label: "Log in",
          to: "/login",
        }
      );

      return;
    }

    /*
     * Required fields.
     *
     * Owner name is intentionally NOT included
     * because it is optional.
     */
    if (
      !dogName.trim() ||
      !location.trim()
    ) {
      showNotification(
        "validation",
        "Please fill in all required fields."
      );

      return;
    }

    /*
     * Photo is required.
     */
    if (!file) {
      showNotification(
        "photo",
        "Please add a photo of your dog."
      );

      return;
    }

    /*
     * If the owner name field is empty,
     * use the user's display name from metadata.
     */
    const finalOwnerName =
      ownerName.trim() || displayName.trim();

    /*
     * Start posting.
     */
    setSubmitting(true);

    /*
     * Remove old notification while posting.
     */
    setNotification(null);

    try {
      /*
       * PostContext handles:
       *
       * File
       *   ↓
       * imageUtils.js
       *   ↓
       * optimized WebP
       *   ↓
       * Cloudinary
       *   ↓
       * image URL + public ID
       *   ↓
       * Supabase
       */
      const { data, error } = await addPost({
        dog_name: dogName.trim(),

        /*
         * Use the manually entered owner name.
         * If empty, use the user's display name.
         */
        owner_name: finalOwnerName || null,

        location: location.trim(),

        /*
         * Description is optional.
         */
        description: description.trim() || null,

        /*
         * Original File.
         *
         * PostContext optimizes it before
         * uploading to Cloudinary.
         */
        image: file,
      });

      if (error) {
        throw error;
      }

      console.log("Post created:", data);

      /*
       * Reset the form after successful posting.
       */
      reset();

      /*
       * Tell the parent that the post
       * was successfully created.
       */
      if (onCreated) {
        onCreated(data);
      }
    } catch (err) {
      console.error(
        "Error creating post:",
        err
      );

      showNotification(
        "error",
        err?.message ||
          "Couldn't post your dog. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card className="p-6 md:p-8 shadow-card border-2 border-border/60 max-w-2xl mx-auto">

        <h2 className="text-2xl md:text-3xl font-bold mb-1">
          Share your pup
        </h2>

        <p className="text-muted-foreground mb-6">
          It only takes a minute. Sign in to share your pup.
        </p>

        <form
          onSubmit={onSubmit}
          className="space-y-5"
        >
          {/* Dog name + owner name */}

          <div className="grid md:grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label htmlFor="dog">
                Dog's name *
              </Label>

              <Input
                id="dog"
                value={dogName}
                onChange={(e) =>
                  setDogName(e.target.value)
                }
                maxLength={60}
                placeholder="Biscuit"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">
                Owner name
              </Label>

              <Input
                id="owner"
                value={ownerName}
                onChange={(e) =>
                  setOwnerName(e.target.value)
                }
                maxLength={60}
                placeholder={
                  displayName || "Optional"
                }
              />

              <p className="text-xs text-muted-foreground">
                Leave empty to use your display name.
              </p>
            </div>

          </div>

          {/* Location */}

          <div className="space-y-2">
            <Label htmlFor="loc">
              Location *
            </Label>

            <Input
              id="loc"
              value={location}
              onChange={(e) =>
                setLocation(e.target.value)
              }
              maxLength={80}
              placeholder="Lisbon, Portugal"
            />
          </div>

          {/* Description */}

          <div className="space-y-2">
            <Label htmlFor="desc">
              Description
            </Label>

            <Textarea
              id="desc"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              maxLength={280}
              rows={3}
              placeholder="A cheeky golden who steals socks for fun…"
            />

            <p className="text-xs text-muted-foreground text-right">
              {description.length}/280
            </p>
          </div>

          {/* Photo */}

          <div className="space-y-2">
            <Label>
              Photo *
            </Label>

            <label
              htmlFor="photo"
              className="flex flex-col items-center justify-center w-full min-h-[180px] rounded-2xl border-2 border-dashed border-border bg-muted/40 hover:bg-muted cursor-pointer transition-smooth overflow-hidden"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-h-72 object-cover"
                />
              ) : (
                <div className="text-center p-6">

                  <ImagePlus className="w-10 h-10 mx-auto text-muted-foreground mb-2" />

                  <p className="text-sm font-medium">
                    Click to upload a photo
                  </p>

                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP — up to 8MB
                  </p>

                </div>
              )}

              <input
                ref={fileRef}
                id="photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFile(
                    e.target.files?.[0] ?? null
                  )
                }
              />
            </label>
          </div>

          {/* Submit */}

          <button
            type="submit"
            disabled={
              submitting || authLoading
            }
            className="w-full inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-bold text-lg bg-gradient-warm text-primary-foreground shadow-glow hover:shadow-card hover:-translate-y-0.5 transition-bounce disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Posting…
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Post my dog
              </>
            )}
          </button>

        </form>
      </Card>

      {/* Reusable notification */}

      <Notification
        notification={notification}
        onDismiss={dismissNotification}
      />
    </>
  );
};