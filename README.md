# SupportAI - Customer Support Chatbot SaaS

A production-ready customer support chatbot SaaS built with Next.js, powered by Groq API, featuring multiple themes, real-time streaming, and embeddable widgets.

## Features

- 🤖 Real-time AI chat with Groq's llama-3.3-70b-versatile model
- 🎨 Three beautiful themes: Glassmorphism Dark, Neo Brutalism, Soft Aurora
- 📊 Live analytics dashboard
- 🔧 Configurable bot settings (name, prompt, greeting, tone)
- 📱 Embeddable widget code
- 💬 Quick reply chips and typing indicators
- 📈 Message feedback system
- 🎯 Multi-turn conversation history

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** shadcn/ui + Tailwind CSS
- **AI:** Groq API (llama-3.3-70b-versatile)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Fonts:** Geist Sans & Geist Mono

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd customeragent
npm install
```

### 2. Install shadcn/ui Components

```bash
npx shadcn@latest init
npx shadcn@latest add button input textarea badge avatar card separator switch scroll-area tooltip select tabs sheet sonner dropdown-menu
```

### 3. Get Groq API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Create an API key
4. Copy the key

### 4. Environment Setup

Create a `.env.local` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your chatbot!

## Default Configuration

- **Bot Name:** Aria
- **System Prompt:** You are Aria, a warm and efficient customer support assistant...
- **Business Context:** SaaS company. 14-day free trial...
- **Greeting:** Hi! I'm Aria 👋 What can I help you with today?
- **Default Theme:** Glassmorphism Dark

## Project Structure

```
app/
├── api/chat/route.ts       # Groq streaming API endpoint
├── components/
│   ├── chat/               # Chat UI components
│   ├── sidebar/            # Left & right panels
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and theme config
└── page.tsx                # Main application
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add `GROQ_API_KEY` environment variable
4. Deploy!

### Other Platforms

The app is compatible with any platform that supports Next.js:
- Netlify
- Railway
- Render
- Self-hosted

## API Usage

The chatbot uses Groq's OpenAI-compatible API:

```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [...conversationHistory],
    systemPrompt: 'Your system prompt'
  })
});
```

## Customization

### Themes

Edit `lib/themes.ts` to add new themes or modify existing ones.

### Bot Configuration

All bot settings are configurable through the right panel:
- Bot name and avatar
- System prompt and business context
- Greeting message
- Response tone

### Embed Code

Generate embeddable widget code from the "Embed" tab in the right panel.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this for your own projects!

## Support

For questions or issues:
- Open a GitHub issue
- Check the [Next.js docs](https://nextjs.org/docs)
- Visit [Groq documentation](https://console.groq.com/docs)
