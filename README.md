# Tech & Security AI Analyzer

A modern, professional web application that provides AI-powered insights and analysis of content from HackerNews stories and 14 HackTheBox RSS feeds. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 📊 **Multi-Source Content**: Fetches from HackerNews stories + 14 HackTheBox RSS feeds
- 🛡️ **Cybersecurity Focus**: Specialized categories (Red Team, Blue Team, Threat Intel, AI/Security, etc.)
- 🤖 **AI-Powered Analysis**: Uses OpenRouter (free!) to provide summaries, sentiment analysis, and key insights
- 📈 **Advanced Filtering**: Filter by source, category, and content type
- 🔀 **Unified Feed**: Seamlessly combines different content types in one view
- 📈 **Trend Analysis**: Cross-source trend identification and community sentiment
- 🎨 **Modern UI**: Professional, responsive design with source-specific styling
- ⚡ **Fast Performance**: Optimized with caching and efficient RSS parsing
- 🔄 **Auto-refresh**: Cron jobs keep data fresh (every 15 minutes)
- 📱 **Mobile-friendly**: Responsive design that works on all devices

## Content Sources

### HackerNews Stories
- Real-time top stories from Hacker News
- Community scores and discussion metrics
- Traditional tech news and startup content

### HackTheBox RSS Feeds (14 feeds)
- **Red Teaming**: Offensive security content
- **Blue Teaming**: Defensive security and SOC content  
- **Threat Intelligence**: Latest threat research and APT analysis
- **Artificial Intelligence**: AI in cybersecurity applications
- **Security 101**: Beginner-friendly security tutorials
- **CISO Diaries**: Leadership and governance insights
- **Write-Ups**: CTF solutions and technical walkthroughs
- **Career Stories**: Cybersecurity career advice
- **Education**: Training and certification content
- **Customer Stories**: Real-world implementation cases
- **Cyber Teams**: Team building and management
- **News**: Latest cybersecurity news and updates
- **Humans of HTB**: Community stories and profiles
- **All Content**: Aggregated feed from all categories

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd hackernews-ai-analyzer
npm install
```

### 2. Environment Setup (Optional)

Copy the environment template:

```bash
cp .env.example .env.local
```

Add your OpenRouter API key for free AI analysis (optional):

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
CRON_SECRET=your_random_secret_for_cron_security
```

**Note**: The app works without an OpenRouter API key - it will use mock analysis instead.

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment on Vercel

### Automatic Deployment

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project in [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and deploy
4. Add environment variables in Vercel dashboard (optional):
   - `OPENROUTER_API_KEY` - Your OpenRouter API key
   - `CRON_SECRET` - Random string for cron endpoint security

### Manual Environment Variables Setup in Vercel

1. Go to your project dashboard in Vercel
2. Click on "Settings" → "Environment Variables"
3. Add the following variables (all optional):

| Name | Value | Description |
|------|-------|-------------|
| `OPENROUTER_API_KEY` | `sk-or-...` | OpenRouter API key for free AI analysis |
| `CRON_SECRET` | `random-string` | Secure your cron endpoint |

### Cron Jobs

The application includes automatic cron jobs that run every 15 minutes to refresh story data. These are configured in `vercel.json` and work automatically on Vercel.

## Project Structure

```
tech-security-ai-analyzer/
├── app/
│   ├── api/
│   │   ├── stories/          # Fetch HN stories
│   │   ├── rss/              # Parse HackTheBox RSS feeds
│   │   ├── content/          # Unified content API
│   │   ├── analyze/          # AI analysis (supports both sources)
│   │   └── cron/             # Scheduled updates
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # App layout
│   └── page.tsx              # Home page
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── Header.tsx            # App header
│   ├── UnifiedContentList.tsx # Combined content list
│   ├── UnifiedContentCard.tsx # Universal content card
│   ├── TrendingTopics.tsx    # Cross-source trend analysis
│   └── LoadingSkeleton.tsx   # Loading states
├── lib/
│   └── utils.ts              # Utility functions
├── vercel.json               # Vercel configuration with RSS crons
└── package.json              # Dependencies + RSS parser
```

## API Endpoints

- `GET /api/stories` - Fetch latest Hacker News stories
- `GET /api/rss` - Parse and fetch HackTheBox RSS feeds  
- `GET /api/content` - Unified API combining both sources with filtering
- `POST /api/analyze` - Get AI analysis for any content type or trends
- `GET /api/cron` - Trigger content refresh (called by Vercel cron)

## Technologies Used

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **AI**: OpenRouter with free GPT models (openai/gpt-oss-20b:free)
- **Data Source**: Hacker News Firebase API
- **Deployment**: Vercel
- **Icons**: Lucide React

## Performance Features

- ⚡ Server-side rendering with Next.js App Router
- 🗄️ Intelligent caching (5-minute cache for stories)
- 🔄 Background refresh via cron jobs
- 📱 Responsive images and layouts
- ⚙️ Optimized bundle size

## AI Analysis Features

### 🆓 Using OpenRouter (FREE!)
The app now uses **OpenRouter** with the free `openai/gpt-oss-20b:free` model, providing:
- **Zero cost** AI analysis
- Same OpenAI-compatible API
- High-quality GPT responses
- No usage limits for the free tier

When OpenRouter API key is provided:
- 📝 **Story Summaries**: AI-generated summaries of each story
- 😊 **Sentiment Analysis**: Positive/Neutral/Negative sentiment scoring
- 🎯 **Key Points**: Important highlights from each story
- 📊 **Technical Level**: Beginner/Intermediate/Advanced classification
- 🎲 **Relevance Score**: How relevant the story is to tech professionals
- 📈 **Trend Analysis**: Daily trends and emerging topics

Without API key:
- Uses intelligent mock analysis based on story metrics
- All features work with simulated data

## 🎯 Current Functionality

### ✅ Multi-Source Content System
- **HackerNews Stories**: Live fetching with community metrics
- **14 HackTheBox RSS Feeds**: Real-time cybersecurity content
- **Unified Feed**: Seamless integration of both content types

### ✅ Advanced Filtering & Categorization
- **Source Filtering**: Toggle HackerNews vs HackTheBox content
- **Category Filtering**: Red Team, Blue Team, AI/Security, Threat Intel, etc.
- **Smart Categorization**: AI-powered content classification

### ✅ Professional UI Features  
- **Source-Specific Styling**: Visual distinction between content types
- **Responsive Design**: Mobile and desktop optimized
- **Real-time Updates**: Live timestamps and refresh functionality
- **Performance Optimized**: Intelligent caching and lazy loading

### ✅ AI Analysis (FREE via OpenRouter)
- **Content Summaries**: AI-generated insights for any content type
- **Sentiment Analysis**: Automated mood and reception analysis
- **Technical Classification**: Beginner/Intermediate/Advanced scoring
- **Cross-Source Trends**: Combined trend analysis from all sources

### ✅ Ready for Production
- **Vercel Optimized**: Zero-config deployment
- **Automatic Crons**: 15-minute refresh cycles
- **Error Handling**: Graceful fallbacks and retry logic
- **SEO-Friendly**: Proper metadata and social sharing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions:
1. Check the GitHub issues
2. Create a new issue with details
3. Include environment and error information

---

**Built with ❤️ for the tech and cybersecurity community**
