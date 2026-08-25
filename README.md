# 🐾 Pawsome

### A social platform for dog lovers.

Pawsome is a community-driven social platform where dog lovers can share their dogs, discover other dogs, and connect with a growing community of people who love dogs.

🌐 **Live:** [pawsome.fans](https://pawsome.fans)

⭐ **If you like Pawsome, please consider giving the repository a star!**

---

## 🐶 About Pawsome

Pawsome was built around a simple idea:

> **Create a place for dog lovers to share their dogs and build a real community around them.**

Users can create an account, share posts about their dogs, discover other dogs, and interact with the community.

Unlike platforms that focus primarily on selling products or monetizing users through subscriptions, Pawsome is being built around the **community first**.

As the community grows, the goal is to work with pet stores and relevant businesses to provide members with exclusive offers, discounts, and community-only promo codes.

The idea is simple:

**Grow the community → partner with businesses → give value back to the community.**

---

## ✨ Features

### 🔐 Authentication

- User registration
- Email and password authentication
- Email verification
- Login and logout
- Secure authentication powered by Supabase Auth
- Transactional email delivery through Brevo SMTP

### 🐕 Dog Posts

Users can create posts containing:

- Dog image
- Dog name
- Owner name
- Description
- Location

Posts can also be:

- ❤️ Liked
- ✏️ Edited
- 🗑️ Deleted

### ⚡ Real-Time Community

Pawsome uses Supabase Realtime to keep the community updated without requiring users to constantly refresh the page.

Real-time updates currently include:

- New posts
- Deleted posts
- Likes
- Like count changes

For example, when one user likes a post, other users can see the updated like count without refreshing the page.

When a user creates or deletes a post, other connected users can also see the change in real time.

### 🖼️ Optimized Image Uploads

Images are uploaded to Cloudinary rather than being stored directly in Supabase.

Before uploading, images are resized on the client side to reduce unnecessary file size, storage usage, and bandwidth.

This allows the application to keep image uploads more efficient while still providing good visual quality.

### 📱 Responsive UI

The interface is designed to work across different screen sizes with a clean, friendly visual style centered around the Pawsome brand.

---

## 💡 Community-First Model

One of the main ideas behind Pawsome is to avoid making the community itself the product.

Many platforms focus on:

- Selling products
- Monthly subscriptions
- Advertising as heavily as possible
- Constantly monetizing users

Pawsome is taking a different approach.

The long-term goal is to build a large and engaged dog-loving community first.

Once the community has enough reach, Pawsome can partner with pet stores and other relevant businesses.

For example:

> A pet store partners with Pawsome and provides a special discount code for Pawsome members.

The business gets exposure to a relevant audience.

The community gets a real benefit.

Pawsome gets a sustainable way to support the platform.

### 🏪 Community Offers — Coming Soon

As the community grows, Pawsome plans to introduce exclusive:

- Pet store discounts
- Community promo codes
- Special offers
- Partner promotions

These offers will initially be available to registered community members.

---

## 🛠️ Tech Stack

### Frontend

- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- JavaScript / JSX
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

### Backend & Services

- [Supabase](https://supabase.com/)
  - Authentication
  - PostgreSQL database
  - Realtime
- [Cloudinary](https://cloudinary.com/)
  - Image storage
  - Image delivery
- [Brevo](https://www.brevo.com/)
  - Transactional SMTP
  - Email verification delivery

### Deployment

- [Cloudflare](https://www.cloudflare.com/)

---

## 🏗️ Technical Highlights

### 🔐 Authentication Flow

Pawsome uses Supabase Auth for authentication.

The registration flow works approximately like this:

```text
User Registration
       ↓
React Application
       ↓
Supabase Auth
       ↓
Email Verification
       ↓
Brevo SMTP
       ↓
User Confirms Email
       ↓
Pawsome Application
```

Email confirmation is enabled to ensure that users verify ownership of their email address before accessing the authenticated experience.

---

### ⚡ Real-Time Updates

Supabase Realtime is used to keep community data synchronized.

This allows changes such as:

```text
User A creates a post
       ↓
Supabase
       ↓
Other connected users
       ↓
Post appears without refresh
```

The same real-time approach is used for:

- New posts
- Deleted posts
- Likes
- Like count updates

For example:

```text
User A likes a post
       ↓
Supabase Realtime
       ↓
Connected users
       ↓
Like count updates without refresh
```

This creates a more dynamic community experience without requiring users to manually reload the page.

---

### 🖼️ Image Optimization

Instead of uploading large original images directly to storage, Pawsome performs client-side image resizing before sending images to Cloudinary.

```text
Original Image
      ↓
Client-side Resize
      ↓
Optimized Image
      ↓
Cloudinary
      ↓
Delivered to Users
```

This helps reduce unnecessary storage usage and bandwidth while keeping images suitable for the application.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have:

- Node.js
- npm
- A Supabase project
- A Cloudinary account

### Clone the Repository

```bash
git clone https://github.com/KareemShuhadh/Pawsome.git

cd Pawsome
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root.

Example:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

recommendation add them in supabase secrets
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
```

> Never commit real credentials, API secrets, service-role keys, or private credentials to GitHub.

### Start the Development Server

```bash
npm run dev
```

The application will then be available through the Vite development server.

---

## 📦 Production Build

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## 🗺️ Roadmap

Pawsome is currently live as an early production MVP and is actively evolving.

### Coming Next

- 💬 Comments on posts
- 👤 User profiles
- 🖼️ Multiple images per post
- 🏪 Community offers and partner discounts
- 💬 Community Discord server

### Future

- 🛠️ Admin dashboard
- 👑 Community management tools
- 📢 Promotion and partner management
- 🏪 Business partnership management
- 🌍 More community features
- 🤝 Local community meetups
- 📍 Connecting dog lovers within the same country
- 🚀 Continued improvements as the community grows

---

## 🌍 The Bigger Vision

Pawsome is starting small.

The goal isn't to build everything at once.

The first step is simply:

> **Build a community of people who love dogs.**

From there, Pawsome can grow into more than a place to post pictures.

It can become a place where dog lovers:

- Discover other dogs
- Meet people with similar interests
- Find useful pet-related offers
- Build local connections
- Participate in community events
- Support businesses that support the community

The long-term vision is to make Pawsome a community where **the users benefit from the growth of the platform**.

---

## 🔒 Security

Sensitive credentials should never be committed to the repository.

Environment variables are used for configuration, while authentication and database security are handled through Supabase.

If you discover a security issue, please avoid publicly opening an issue containing sensitive information.

---

## 📄 License

This project is currently available for viewing on GitHub.

No open-source license has been granted at this time.

All rights reserved unless otherwise stated.

---

## 🐾 Pawsome

Built for people who believe dogs deserve their own community.

**Share your dog. Discover others. Build the community.**

🌐 [Visit Pawsome](https://pawsome.fans)

⭐ **If you like the idea behind Pawsome, please consider giving the repository a star!**
