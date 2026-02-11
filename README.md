# React Site - WordPress Migration

This project is a React-based recreation of the WordPress site using the data extracted from the database dump.

## Features

- **React 18 + Vite**: Fast and modern foundation.
- **Tailwind CSS**: Styling matching the design system.
- **Dynamic Content**: Pages and Blog posts loaded from `src/data/`.
- **SEO Ready**: Using `react-helmet-async`.
- **Form Handling**: Contact form with local storage simulation.
- **Responsive**: Fully mobile-optimized.

## Project Structure

- `src/components`: Reusable UI components (Header, Footer).
- `src/layouts`: Page layouts (MainLayout).
- `src/pages`: Route-specific page components.
- `src/data`: JSON data extracted/simulated from WordPress DB.
- `public/uploads`: Media assets migrated from WordPress.

## Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```

3.  **Build for Production**
    ```bash
    npm run build
    ```

## Content Management

To update content, edit the JSON files in `src/data/`:
- `pages.json`: Manage static pages (Home, About, Services).
- `posts.json`: Manage blog posts.
- `menu.json`: Update navigation links.
"# Kottravai" 
