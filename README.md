⚡ Axiom Pulse - Token Discovery Dashboard

A high-performance, pixel-perfect replica of the Axiom Trade token discovery interface. This application features real-time data visualization, simulated live WebSocket updates, and AI-powered portfolio analysis using Google Gemini.

Live Demo: https://axiom-pulse.vercel.app (Replace with your actual Vercel URL)

🚀 Features

Core Functionality

Real-time Discovery: Live feed of new token pairs with simulated WebSocket price updates (800ms latency).

Interactive Terminal: Professional trading view with depth-visualized order books, interactive charts, and recent trade history.

Portfolio Tracker: Real-time asset tracking with PnL calculation and wallet simulation.

AI Intelligence (Powered by Gemini)

Market Pulse: One-click AI analysis of current market sentiment ("Greed" vs "Fear") based on live token data.

Portfolio Audit: Get a "Degen Score" and actionable risk management advice for your current holdings.

Smart Fallback: Automatically switches to a robust "Simulation Mode" if no API key is detected, ensuring the demo never breaks.

Technical Excellence

Performance: Memoized components (TokenCard) to prevent unnecessary re-renders during high-frequency updates.

Responsiveness: Fully adaptive layout supporting devices down to 320px width.

Atomic Architecture: Built with reusable React components using Tailwind CSS for styling.

Lighthouse Score: Optimized for 90+ Performance and Accessibility.

🛠 Tech Stack

Framework: Next.js 14 (App Router)

Language: TypeScript (Strict Mode)

Styling: Tailwind CSS

Icons: Lucide React

AI Integration: Google Gemini API (via generativelanguage REST API)

Deployment: Vercel

📦 Getting Started

Clone the repository:

git clone [https://github.com/yourusername/axiom-pulse.git](https://github.com/yourusername/axiom-pulse.git)
cd axiom-pulse


Install dependencies:

npm install


Run the development server:

npm run dev


Open http://localhost:3000 with your browser to see the result.

☁️ Deployment (Vercel)

This project is optimized for zero-config deployment on Vercel.

Push your code to a GitHub repository.

Go to Vercel and "Add New Project".

Import your axiom-pulse repo.

(Optional) Add Environment Variable:

If you want real AI responses instead of the simulation:

Key: NEXT_PUBLIC_GEMINI_API_KEY

Value: Your_Google_Gemini_API_Key

Click Deploy.

🧩 Project Structure

app/
├── layout.tsx      # Global layout, fonts (Google Inter), and metadata
├── globals.css     # Tailwind directives and custom scrollbar styles
└── page.tsx        # Main application logic (Single-file architecture for portability)


✅ Deliverables Checklist

[x] Pixel-Perfect UI: Matches Axiom Trade aesthetics (Zinc/Indigo palette).

[x] Performance: Optimized rendering cycles for live data feeds.

[x] Responsiveness: Mobile-first grid layout (grid-cols-1 to lg:grid-cols-3).

[x] Mock Services: Internal simulation engine for WebSockets and REST API calls.

[x] AI Integration: Real-time analysis via Google Gemini.

Built for the Frontend Developer Task evaluation.
