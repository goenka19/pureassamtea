# PureAssamTea Group Website

B2B Tea Manufacturing Company Website - Built with Astro + Tailwind CSS

## 🚀 Quick Start

```bash
# Navigate to project
cd pureassamtea-website

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:4321
```

## 📁 Project Structure

```
/
├── src/
│   ├── components/     # Reusable components (Header, Hero, etc.)
│   ├── layouts/        # Page layouts
│   ├── pages/          # Route pages
│   └── styles/         # Global styles
├── public/             # Static assets (images, fonts)
├── package.json
├── astro.config.mjs
└── tailwind.config.mjs
```

## 🎨 Design System

**Colors:**
- `--tea-green: #006C3F` (Primary brand color)
- `--tea-dark: #1B4D3E` (Dark accents)
- `--tea-light: #E8F5E9` (Light backgrounds)

**Typography:**
- Font: Inter (Google Fonts)
- Mobile-first responsive scaling

**Components:**
- All components built mobile-first
- Responsive breakpoints: sm (640px), md (768px), lg (1024px)

## 🔧 Development Workflow

### Method 1: Design in Paper → Export to Code

1. Open **Paper app**
2. Design your component visually
3. I'll use Paper MCP to export to code
4. Iterate until perfect

### Method 2: Edit Code Directly

1. Edit files in `src/components/`
2. See changes instantly at `localhost:4321`
3. Mobile testing: Use browser dev tools

## 📱 Mobile-First Approach

This site is designed mobile-first because most B2B visitors view on mobile:
- Base styles are for mobile (390px width)
- `sm:`, `md:`, `lg:` prefixes add desktop enhancements
- Sticky header optimized for thumb reach
- Large tap targets (44px minimum)

## 🏗️ Build for Production

```bash
npm run build
# Output in /dist folder
```

## 📝 Content Updates

### To Update Text/Content:
- Edit files in `src/pages/` or `src/components/`
- Content is plain text in Astro components

### To Add Images:
1. Place images in `public/images/`
2. Reference as `/images/your-image.jpg`
3. Recommended: WebP format, max 1200px width

### To Add New Pages:
1. Create `.astro` file in `src/pages/`
2. File name = URL path (e.g., `about.astro` → `/about`)
3. Use Layout component for consistency

## 🎭 Paper Integration

To iterate designs in Paper:
1. Make sure Paper app is running
2. I'll use MCP to sync designs
3. Changes in Paper reflect in code

## 📞 Contact

For technical support or changes, contact the developer.
