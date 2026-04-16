'use client';

import { useEffect, useState } from 'react';
import { useAudioStore } from '@/lib/audioStore';
import { AudioEngine } from '@/lib/audioEngine';

export function TransportControls() {
  const [engine, setEngine] = useState<AudioEngine | null>(null);

  const isPlaying = useAudioStore((state) => state.isPlaying);
  const currentTime = useAudioStore((state) => state.currentTime);
  const duration = useAudioStore((state) => state.duration);
  const playbackRate = useAudioStore((state) => state.playbackRate);
  const volume = useAudioStore((state) => state.volume);
  const audioBuffer = useAudioStore((state) => state.audioBuffer);
  const audioContext = useAudioStore((state) => state.audioContext);

  const setIsPlaying = useAudioStore((state) => state.setIsPlaying);
  const setCurrentTime = useAudioStore((state) => state.setCurrentTime);
  const setPlaybackRate = useAudioStore((state) => state.setPlaybackRate);
  const setVolume = useAudioStore((state) => state.setVolume);
  const setAudioContext = useAudioStore((state) => state.setAudioContext);

  // Initialize AudioContext and engine
  useEffect(() => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
    }
  }, [audioContext, setAudioContext]);

  // Initialize engine
  useEffect(() => {
    if (audioContext && !engine) {
      const newEngine = new AudioEngine(audioContext);
      setEngine(newEngine);
    }

    return () => {
      engine?.dispose();
    };
  }, [audioContext, engine]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const centis = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!engine || !audioBuffer) return;

    if (isPlaying) {
      engine.pause();
    } else {
      engine.play(audioBuffer);
    }
  };

  const handleStop = () => {
    if (!engine) return;
    engine.pause();
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (engine) {
      engine.seek(newTime);
    }
  };

  const handleRateChange = (newRate: number) => {
    if (engine) {
      engine.setPlaybackRate(newRate);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (engine) {
      engine.setVolume(newVolume);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-900 border border-gray-800 rounded">
      {/* Playback buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handlePlayPause}
          disabled={!audioBuffer}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-600 text-white rounded font-medium transition-colors"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <button
          onClick={handleStop}
          disabled={!audioBuffer}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded font-medium transition-colors"
        >
          ⏹ Stop
        </button>

        {/* Time display */}
        <div className="text-sm font-mono text-gray-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Scrubber */}
      <div className="flex items-center gap-2">
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-2 bg-gray-700 rounded accent-cyan-600 cursor-pointer"
          disabled={!audioBuffer}
        />
      </div>

      {/* Speed and Volume */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Speed:</label>
          <div className="flex gap-1">
            {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => handleRateChange(rate)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  playbackRate === rate
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <label className="text-xs text-gray-500">Volume:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-2 bg-gray-700 rounded accent-amber-500 cursor-pointer max-w-32"
          />
          <span className="text-xs text-gray-500 min-w-8">{Math.round(volume * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
