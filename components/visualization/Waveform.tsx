'use client';

import { useEffect, useRef } from 'react';
import { useAudioStore } from '@/lib/audioStore';
import { renderWaveform } from '@/lib/audioEngine';

export function Waveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioBuffer = useAudioStore((state) => state.audioBuffer);
  const currentTime = useAudioStore((state) => state.currentTime);
  const zoom = useAudioStore((state) => state.waveformZoom);
  const scroll = useAudioStore((state) => state.waveformScroll);
  const selectedWordIndex = useAudioStore((state) => state.selectedWordIndex);
  const words = useAudioStore((state) => state.words);

  const setWaveformScroll = useAudioStore((state) => state.setWaveformScroll);
  const setWaveformZoom = useAudioStore((state) => state.setWaveformZoom);
  const setSelectedWordIndex = useAudioStore((state) => state.setSelectedWordIndex);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;

    // Set canvas resolution
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;

    renderWaveform(canvas, audioBuffer, zoom, scroll);
  }, [audioBuffer, currentTime, zoom, scroll, selectedWordIndex]);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setWaveformZoom(Math.max(1, Math.min(100, zoom * factor)));
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioBuffer) return;

    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;

    const duration = audioBuffer.duration;
    const pixelsPerSecond = (canvas.width / duration) * zoom;
    const newTime = scroll + (x * canvas.width) / pixelsPerSecond;

    useAudioStore.setState({ currentTime: Math.max(0, Math.min(duration, newTime)) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400">WAVEFORM</h3>
        <div className="flex gap-2 text-xs text-gray-500">
          <span>Zoom: {zoom.toFixed(1)}x</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-32 bg-[#0a0a0f] border border-gray-800 cursor-crosshair rounded"
        onWheel={handleWheel}
        onClick={handleClick}
      />
    </div>
  );
}
