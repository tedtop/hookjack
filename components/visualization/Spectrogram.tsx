'use client';

import { useEffect, useRef, useState } from 'react';
import { useAudioStore } from '@/lib/audioStore';
import { renderSpectrogram } from '@/lib/audioEngine';

export function Spectrogram() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioBuffer = useAudioStore((state) => state.audioBuffer);
  const spectrogramData = useAudioStore((state) => state.spectrogramData);
  const setSpectrogramData = useAudioStore((state) => state.setSpectrogramData);

  useEffect(() => {
    if (!audioBuffer || spectrogramData) return;

    setLoading(true);
    setProgress(0);

    // Pre-render spectrogram in background
    renderSpectrogram(audioBuffer, (p) => setProgress(p))
      .then((data) => {
        setSpectrogramData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Spectrogram rendering error:', error);
        setLoading(false);
      });
  }, [audioBuffer, spectrogramData, setSpectrogramData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !spectrogramData) return;

    canvas.width = spectrogramData.width;
    canvas.height = spectrogramData.height;

    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(spectrogramData, 0, 0);
  }, [spectrogramData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400">SPECTROGRAM</h3>
        {loading && <span className="text-xs text-gray-500">{(progress * 100).toFixed(0)}%</span>}
      </div>

      <div className="relative overflow-hidden rounded border border-gray-800 bg-[#0a0a0f]">
        <div className="flex gap-4">
          {/* Frequency labels */}
          <div className="flex flex-col justify-between py-2 px-2 text-xs text-gray-600 font-mono">
            <span>20k</span>
            <span>5k</span>
            <span>1k</span>
            <span>100</span>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-x-auto">
            <canvas
              ref={canvasRef}
              className="h-48 bg-[#0a0a0f]"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
