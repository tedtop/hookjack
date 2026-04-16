'use client';

import { useAudioStore } from '@/lib/audioStore';
import { UploadSection } from '@/components/audio/UploadSection';
import { TransportControls } from '@/components/audio/TransportControls';
import { StructureBar } from '@/components/visualization/StructureBar';
import { Waveform } from '@/components/visualization/Waveform';
import { Spectrogram } from '@/components/visualization/Spectrogram';
import { LyricsTimeline } from '@/components/visualization/LyricsTimeline';
import { LyricsReading } from '@/components/visualization/LyricsReading';
import { WordDetailsPanel } from '@/components/ui/WordDetailsPanel';

export default function Home() {
  const audioBuffer = useAudioStore((state) => state.audioBuffer);
  const title = useAudioStore((state) => state.title);
  const selectedWordIndex = useAudioStore((state) => state.selectedWordIndex);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#1a1a24] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0f] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎵</span>
            <h1 className="text-xl font-bold">HOOKJACK</h1>
            {title && <span className="text-sm text-gray-500">/ {title}</span>}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {!audioBuffer ? (
          <UploadSection />
        ) : (
          <>
            {/* Visualization stack */}
            <StructureBar />
            <Waveform />
            <Spectrogram />
            <LyricsTimeline />

            {/* Bottom section with lyrics and controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <LyricsReading />
              </div>

              <div>
                <TransportControls />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Word details panel */}
      {selectedWordIndex !== null && <WordDetailsPanel />}
    </div>
  );
}
