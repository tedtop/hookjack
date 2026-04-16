# Hookjack — Song Deconstruction & Visual DAW

A browser-based song visualization and word-editing interface. Think Genius.com lyrics meets Audacity meets a beautiful modern DAW.

## Phase 1: Song Visualization & Analysis

**Key Features:**
- 🎵 **Audio Upload** — Drag-and-drop MP3/WAV/FLAC files
- 📊 **Waveform Display** — Full-song, zoomable waveform with real-time playhead
- 🌈 **Spectrogram** — Stunning frequency heatmap (black→blue→cyan→yellow→white) with log-scale frequency axis
- 📝 **Lyrics Timeline** — Word-by-word transcription with precise timestamps (via WhisperX)
- 🎼 **Song Structure** — Auto-detected intro/verse/chorus/bridge/outro sections (via Claude)
- 🎚️ **Transport Controls** — Play, pause, seek, speed adjustment, volume control
- ✨ **Word Selection** — Click any word to highlight its time range across all visualizations

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Get API Keys
- **Replicate API**: https://replicate.com (free tier works)
- **Anthropic API**: https://console.anthropic.com

### 3. Configure Environment
Create `.env.local`:
```
REPLICATE_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
```

### 4. Run Development Server
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## How to Use

1. **Upload a Song** — Drag or click to upload an MP3, WAV, or FLAC file
2. **Wait for Analysis** — The app will:
   - Decode the audio
   - Transcribe with word-level timestamps (WhisperX)
   - Detect song structure (Claude)
   - Pre-render the spectrogram
3. **Explore** — Zoom the waveform, click words in either lyrics view
4. **Select Words** — Click any word to highlight it across all views and open the edit panel

## Technical Stack

- **Framework**: Next.js 14 (App Router), TypeScript
- **Audio**: Web Audio API (OfflineAudioContext for spectrogram)
- **State**: Zustand
- **Styling**: Tailwind CSS (dark theme)
- **Transcription**: WhisperX on Replicate
- **Structure**: Claude Sonnet on Anthropic API

## Project Structure

```
app/
├── api/
│   ├── whisperx/route.ts
│   └── structure/route.ts
├── page.tsx
└── layout.tsx

components/
├── audio/
│   ├── UploadSection.tsx
│   └── TransportControls.tsx
├── ui/
│   └── WordDetailsPanel.tsx
└── visualization/
    ├── Waveform.tsx
    ├── Spectrogram.tsx
    ├── StructureBar.tsx
    ├── LyricsTimeline.tsx
    └── LyricsReading.tsx

lib/
├── audioStore.ts
└── audioEngine.ts
```

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 15+

## License

MIT
