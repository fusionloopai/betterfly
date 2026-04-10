# betterfly

**Free revenue operations audit tool with AI-powered workflow mapping.**

Map your business processes, identify revenue leaks, and get actionable automation suggestions — all in minutes.

## Features

- **Process Mapping** — Visualize your entire revenue flow from attraction to retention
- **Revenue Leak Detection** — AI identifies where money is lost in your operations
- **Automation Suggestions** — Specific tool recommendations (Zapier, HubSpot, etc.) with triggers and actions
- **Editable Workflows** — Correct the AI's map and re-analyze in real-time
- **Image Upload** — Drop in a whiteboard diagram or flowchart; Claude analyzes it directly
- **PDF Export** — Share audit results with your team

## Stack

- **Frontend:** Vanilla HTML, CSS, JS. Pacifico font for branding. ~800 lines.
- **Backend:** Vercel Edge Function proxying to Anthropic Claude API
- **Model:** claude-opus-4-6 (multimodal, best reasoning)
- **Deployment:** Vercel (auto-deploy on push)

## Quick Start

### Clone and Deploy

```bash
git clone https://github.com/fusionloopai/betterfly.git
cd betterfly
vercel
```

### Environment Setup

Set this in your Vercel project:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Testing Locally (requires Node.js)

```bash
npm install -g vercel
vercel dev
# Opens http://localhost:3000
```

## File Structure

```
betterfly/
├── index.html          — Full app (all CSS + JS inline)
├── api/
│   └── analyze.js      — Vercel Edge Function
├── vercel.json         — Deployment config
└── README.md
```

## How It Works

1. User enters business description (or uploads a diagram)
2. Frontend sends to `/api/analyze`
3. Edge Function proxies to Claude API with structured system prompt
4. Claude returns JSON with:
   - Process map (8 business stages + health status)
   - Revenue leaks (sorted by impact)
   - Automation opportunities (with tool names, triggers, time saved)
   - Implementation roadmap
5. Frontend renders results, allows stage editing + re-analysis
6. User can export to PDF

## System Prompt

The Claude system prompt is embedded in `api/analyze.js`. It instructs the model to:
- Map businesses through 8 standard revenue stages
- Identify specific revenue leak signals (slow response times, missed invoices, etc.)
- Suggest 3+ automation opportunities with named tools
- Score recommendations by ROI (revenue impact 40%, speed 30%, effort 20%, leverage 10%)
- Return strict JSON only, no markdown

## Customization

**Colors:** Edit CSS custom properties in `index.html` `<style>` block
- `--teal`: #00BFA6
- `--coral`: #FF6B6B
- `--bg`: #FFFDF9

**Logo:** Replace SVG in `index.html` (diamond + rectangles, teal → coral gradient)

**Wordmark Font:** Currently Pacifico (cursive). Change in CSS.

## Made by

[FusionLoop AI](https://fusionloop.io) — Revenue operations consulting and AI systems.

---

**Questions?** Open an issue or contact betterfly@fusionloop.io
