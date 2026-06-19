# Droplink - Free Subdomains for Server Panels

Droplink provides instant, free subdomains for game servers and hosting panels. No DNS setup required, just create your account and get a professional subdomain in seconds.

## Features

- ⚡ **Instant Subdomains** - Get your domain live immediately
- 🎮 **Panel Compatible** - Works with Pterodactyl, Pelican, and more
- 🆓 **Always Free** - Core features stay free forever
- 🚀 **Instant Propagation** - DNS records go live instantly

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js / Python (separate repo)
- **Hosting**: GitHub Pages (frontend)

## Project Structure

```
.
├── index.html                    # Landing page
├── assets/
│   ├── styles.css               # Main stylesheet (Silver theme)
│   └── app.js                   # Shared JavaScript utilities
└── README.md                    # This file
```

## Development

### Local Setup

1. Clone the repository
2. Open `index.html` in your browser
3. No build step required - pure HTML/CSS/JS

### File Organization for GitHub Pages

This site is configured for GitHub Pages hosting:
- Root `index.html` serves as the landing page
- All assets are in the `assets/` directory
- CSS uses CSS variables for easy theming

## Theme

The site uses a **Silver theme** with:
- Dark background (#0f0f0f)
- Silver accents (#c0c0c0 - #e0e0e0)
- Clean, modern UI
- Responsive design

### Color Variables

All colors are defined in `assets/styles.css` using CSS custom properties:

```css
:root {
  --silver: #c0c0c0;
  --silver-light: #e0e0e0;
  --silver-dark: #909090;
  --gradient-silver: linear-gradient(135deg, #d0d0d0 0%, #a8a8a8 50%, #b8b8b8 100%);
}
```

## Customization

### Changing Colors

Edit the `:root` CSS variables in `assets/styles.css`:

```css
:root {
  --bg-primary: #0f0f0f;      /* Main background */
  --text-primary: #f5f5f5;    /* Main text */
  --silver: #c0c0c0;          /* Accent color */
}
```

## Deployment

This site is hosted on GitHub Pages:

1. Push changes to `main` branch
2. GitHub Pages automatically deploys from `/root`
3. Site is live at `https://zarekssdls.github.io/droplink.github.io/`

## License

All rights reserved © 2026 Droplink
