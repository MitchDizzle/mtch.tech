# mtch.tech

A modular Vue 3 + Vite website with automatic content discovery from markdown files. Built for easy content management - just add markdown files and they automatically appear on the site!

## Features

- **Auto-discovery**: Drop markdown files in content folders and they automatically appear on your site
- **Modern Stack**: Vue 3, Vite, TailwindCSS, Vue Router
- **Markdown Support**: Write content in markdown with frontmatter metadata
- **Auto-deploy**: GitHub Actions automatically builds and deploys to nfoservers on push to master
- **Organized Content**: Separate sections for portfolio, recipes, and blog posts
- **Git-friendly**: Every new piece of content = a git commit (GitHub activity!)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/MitchDizzle/mtch.tech.git
   cd mtch.tech
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Adding Content

This is the best part - adding content is simple!

### Content Structure

```
src/content/
├── portfolio/          # Portfolio projects
│   └── my-project.md
├── recipes/
│   ├── baking/        # Baking recipes
│   │   └── cookies.md
│   └── cooking/       # Cooking recipes
│       └── pasta.md
└── blog/              # Blog posts
    └── my-post.md
```

### Adding a New Post

1. Create a new markdown file in the appropriate folder
2. Add frontmatter at the top
3. Write your content in markdown
4. Commit and push - it automatically appears!

### Frontmatter Format

Every markdown file should have frontmatter at the top:

```markdown
---
title: "My Amazing Project"
description: "A brief description of what this is"
date: 2025-12-31
updated: 2025-12-31  # Optional
tags: ["vue", "web-dev", "cool-stuff"]
image: "/images/project-screenshot.jpg"  # Optional
---

# Your Content Here

Write your content in markdown...
```

### Example: Adding a Recipe

```bash
# Create a new file
cat > src/content/recipes/baking/chocolate-cake.md << 'EOF'
---
title: "Decadent Chocolate Cake"
description: "Rich, moist chocolate cake perfect for any occasion"
date: 2025-12-31
tags: ["chocolate", "cake", "dessert"]
---

# Decadent Chocolate Cake

The best chocolate cake recipe you'll ever make!

## Ingredients

- 2 cups flour
- 2 cups sugar
- 3/4 cup cocoa powder
...

## Instructions

1. Preheat oven to 350°F
2. Mix dry ingredients...
...
EOF

# Commit and push
git add .
git commit -m "Add chocolate cake recipe"
git push
```

That's it! The recipe will automatically appear in your recipes section.

## Deployment

### Setting up Auto-Deployment

The site automatically deploys to nfoservers when you push to the `master` or `main` branch.

1. Go to your GitHub repository settings
2. Navigate to **Secrets and variables > Actions**
3. Add these secrets:
   - `FTP_SERVER` - Your FTP server hostname (e.g., ftp.nfoservers.com)
   - `FTP_USERNAME` - Your FTP username
   - `FTP_PASSWORD` - Your FTP password
   - `FTP_SERVER_DIR` - Target directory (e.g., `/public_html/`)

4. Push to master - GitHub Actions will automatically:
   - Install dependencies
   - Build the site
   - Deploy to your nfoservers hosting

### Manual Deployment

If you prefer to deploy manually:

```bash
# Build the site
npm run build

# Upload the dist/ folder to your server via FTP/SFTP
# Use your preferred FTP client or command-line tool
```

## Project Structure

```
mtch.tech/
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Actions deployment
├── src/
│   ├── assets/               # Images, fonts, etc.
│   ├── components/
│   │   ├── ui/              # UI components
│   │   └── [content cards]
│   ├── composables/
│   │   └── useContent.js    # Auto-discovery magic!
│   ├── content/             # Your markdown content
│   │   ├── portfolio/
│   │   ├── recipes/
│   │   │   ├── baking/
│   │   │   └── cooking/
│   │   └── blog/
│   ├── layouts/
│   │   └── DefaultLayout.vue
│   ├── pages/               # Route pages
│   ├── router/
│   │   └── index.js
│   ├── App.vue
│   ├── main.js
│   └── style.css            # Tailwind styles
├── public/                  # Static assets
├── .env.example            # Environment variables template
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## How Auto-Discovery Works

The site uses Vite's `import.meta.glob()` to automatically discover all markdown files in the `src/content` directory. When you add a new file:

1. Vite detects the new markdown file
2. The `useContent` composable parses the frontmatter and content
3. The file automatically appears in the appropriate section
4. The slug is generated from the filename

No need to update routes, imports, or any code!

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Vue Router** - Official router for Vue.js
- **markdown-it** - Markdown parser
- **gray-matter** - Parse frontmatter from markdown
- **GitHub Actions** - CI/CD pipeline
- **FTP-Deploy-Action** - Automated FTP deployment

## Customization

### Changing Colors/Styles

Edit `src/style.css` and `tailwind.config.js` to customize the look and feel.

### Adding New Sections

1. Create a new folder in `src/content/`
2. Add a route in `src/router/index.js`
3. Create a page component in `src/pages/`
4. Add navigation link in `src/layouts/DefaultLayout.vue`

### Modifying Auto-Discovery

The auto-discovery logic is in `src/composables/useContent.js`. You can customize how content is parsed, sorted, and displayed.

## Future Enhancements

Potential features to add:

- Git timestamp extraction (automatic creation/modified dates)
- Image optimization
- Search functionality
- RSS feed generation
- Dark mode
- Content categories/filtering
- Related posts/projects

## License

MIT

## Contributing

Feel free to submit issues or pull requests!

## Author

Built by Mitch - [mtch.tech](https://mtch.tech)
