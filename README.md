# Bluesky Firehose Gallery

A real-time, 100% client-side image gallery that streams photos from the Bluesky/ATProto network firehose. Watch as images are posted to Bluesky in real-time in a beautiful, endlessly scrolling grid.

## Features

- 🔴 **Live Image Feed**: Stream images as they're posted to Bluesky in real-time
- 🎨 **Dual Layouts**: Toggle between masonry (Pinterest-style) and uniform grid layouts
- 🔍 **Text Search**: Filter images by keywords in alt text, post text, or usernames
- ⏸️ **Pause Stream**: Temporarily pause the incoming stream
- 🧘 **Zen Mode**: Hide all UI for a distraction-free viewing experience
- 📱 **Responsive Design**: Works beautifully on desktop, tablet, and mobile
- ⚡ **Performance Optimized**: Lazy loading, image limits, and efficient rendering

## Tech Stack

- **Vanilla JavaScript (ES6+)** - Pure performance, no framework overhead
- **Vite** - Lightning-fast development and optimized production builds
- **Jetstream** - Bluesky's lightweight JSON streaming API (no complex encoding!)
- **CSS Grid** - Modern, native masonry and grid layouts

## Local Development

### Prerequisites

- Node.js 18+ and npm

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd bskygallery
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:3000`

### Development Scripts

- `npm run dev` - Start development server with hot module replacement
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Deployment

This is a 100% static website and can be deployed to any static hosting service.

### GitHub Pages

1. Push your code to GitHub
2. Go to Settings → Pages
3. Select the branch and set source to `/root`
4. Or use the included GitHub Actions workflow (`.github/workflows/deploy.yml`)

The GitHub Actions workflow will automatically build and deploy on every push to `main`.

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Or connect your GitHub repo through the Vercel dashboard

Configuration is included in `vercel.json`.

### Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run `netlify deploy --prod`
3. Or drag-and-drop the `dist` folder to Netlify dashboard

Configuration is included in `netlify.toml`.

## Architecture

### Project Structure

```
bskygallery/
├── index.html              # Main HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── README.md              # This file
├── src/
│   ├── main.js            # Application entry point
│   ├── firehose.js        # Jetstream connection & message parsing
│   ├── state.js           # State management (Observer pattern)
│   ├── components/
│   │   ├── FilterBar.js   # Filter controls UI
│   │   ├── ImageGrid.js   # Image grid/masonry rendering
│   │   └── Modal.js       # Image detail modal
│   ├── utils/
│   │   ├── imageUrl.js    # CDN URL construction
│   │   └── filters.js     # Filter logic (search)
│   └── styles/
│       └── main.css       # All styles and animations
└── deployment configs
    ├── vercel.json
    ├── netlify.toml
    └── .github/workflows/
```

### Key Components

#### Jetstream Connection (`src/firehose.js`)
- Establishes WebSocket connection to Bluesky's Jetstream service
- Parses JSON messages (no complex CBOR/CAR encoding!)
- Filters for `app.bsky.feed.post` records with image embeds
- Extracts metadata and constructs CDN URLs
- Handles reconnection logic with exponential backoff

#### State Management (`src/state.js`)
- Centralized state using Observer pattern
- Manages image array with rolling window (max 200 images)
- Stores filter settings and UI preferences
- Notifies subscribers on state changes

#### Image Grid (`src/components/ImageGrid.js`)
- Renders filtered images in masonry or grid layout
- Handles lazy loading and image errors
- Multi-image post support (combines all images from a post into a single tile)
- Smooth animations for new images

#### Filter System (`src/utils/filters.js`)
- Text search across alt text, post text, and usernames
- Efficient debouncing for search input

## Performance Optimizations

- **Lazy Loading**: Images load only when entering viewport
- **Rolling Window**: Maximum 200 images to prevent memory issues
- **Debounced Search**: Reduces filtering computation
- **Efficient Rendering**: Minimal DOM updates using CSS Grid
- **Image Thumbnails**: Fast initial load with full-size on modal

## Browser Compatibility

- Modern browsers supporting ES6+
- CSS Grid support required
- WebSocket support required

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Known Limitations

- Streams network posts (high volume)
- No authentication required (public Jetstream service)
- Image quality depends on original post
- Jetstream provides lightweight JSON (no encoding overhead!)
- Maximum 200 images displayed at once

## Future Enhancements

- [ ] Add option to filter by specific users/handles
- [ ] Implement pagination for older images
- [ ] Add image export/download feature
- [ ] Create custom feeds by hashtags
- [ ] Add keyboard shortcuts
- [ ] Implement image quality selector
- [ ] Add analytics and stats dashboard

## License

MIT License - feel free to fork and modify as needed!

## Contributing

Contributions welcome! Please open an issue or pull request.

## Acknowledgments

- Built on the [AT Protocol](https://atproto.com/)
- Powered by [Bluesky](https://bsky.app/)
- Icons and UI inspiration from various sources

