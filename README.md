# NanoMarks - AI Bookmark Manager

NanoMarks is a Chrome extension that uses your browser's built-in, on-device AI (Gemini Nano) to automatically categorize, summarize, and organize your entire bookmark collection. Your bookmarks are a mess; this extension fixes them.

🔒 All processing is done 100% locally on your machine. Your data, URLs, and browsing habits never leave your computer.

## Features

- **On-Device AI Analysis**: Uses Chrome's built-in LanguageModel API to analyze your bookmarks without sending data to a server.
- **Smart Multi-Categorization**: Automatically assigns relevant categories to every bookmark.
- **AI Summaries**: Generates clean, one-sentence summaries for each link.
- **Persistent Caching**: All AI data is saved locally. Scan once.
- **Modern Card-Based UI**: Clean interface showing favicon, title, categories, and summary.
- **Advanced Filtering & Search**: Filter by status and topic. Search across all data.
- **Full Management Tools**: Star bookmarks, track read status, copy links, add current page.
- **Export to JSON**: Download your enhanced bookmark list anytime.

## Tech Stack

- **Frontend**: Astro, React, Tailwind CSS, DaisyUI
- **Backend**: Cloudflare Workers, Hono, D1 Database, Drizzle ORM
- **Email**: Resend
- **AI**: Chrome Built-in AI (Gemini Nano)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) runtime
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) CLI
- Cloudflare account

### Installation

```bash
# Install dependencies
bun install

# Run locally (client + worker)
bun dev
```

### Development

```bash
# Start client only (Astro dev server)
bun run client

# Start worker only (Wrangler dev)
bun run worker
```

### Deployment

```bash
# Deploy to staging
bun run deploy:staging

# Deploy to production
bun run deploy:prod
```

## Project Structure

```
src/
├── client/          # Astro frontend
│   ├── components/  # React & Astro components
│   ├── layouts/     # Page layouts
│   ├── pages/       # Static pages
│   └── styles/      # Global styles
└── server/          # Cloudflare Worker
    ├── db/          # Database schema & queries
    ├── middleware/  # Auth & rate limiting
    ├── service/     # Email service
    └── utils/       # Helper functions
```

## API Endpoints

- `POST /api/subscribe` - Subscribe to waitlist
- `GET /api/subscriber-count` - Get subscriber count
- `GET /api/confirm` - Confirm subscription
- `GET /api/unsubscribe` - Unsubscribe
- `GET /api/health` - Health check

## License

MIT