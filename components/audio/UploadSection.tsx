'use client';

import { useRef, useState } from 'react';
import { useAudioStore } from '@/lib/audioStore';
import { decodeAudioFile } from '@/lib/audioEngine';

export function UploadSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAudioBuffer = useAudioStore((state) => state.setAudioBuffer);
  const setTitle = useAudioStore((state) => state.setTitle);
  const setDuration = useAudioStore((state) => state.setDuration);
  const setSampleRate = useAudioStore((state) => state.setSampleRate);
  const setWords = useAudioStore((state) => state.setWords);
  const setSections = useAudioStore((state) => state.setSections);
  const reset = useAudioStore((state) => state.reset);

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      // Decode audio
      const buffer = await decodeAudioFile(file);
      setAudioBuffer(buffer);
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
      setDuration(buffer.duration);
      setSampleRate(buffer.sampleRate);

      // Send to WhisperX
      const formData = new FormData();
      formData.append('file', file);

      const whisperResponse = await fetch('/api/whisperx', {
        method: 'POST',
        body: formData,
      });

      if (!whisperResponse.ok) {
        throw new Error('Transcription failed');
      }

      const { words } = await whisperResponse.json();
      setWords(words);

      // Detect structure
      const structureResponse = await fetch('/api/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words }),
      });

      if (structureResponse.ok) {
        const { sections } = await structureResponse.json();
        setSections(sections);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      reset();
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-700 hover:border-cyan-500 rounded-lg p-8 text-center cursor-pointer transition-colors bg-gray-900 hover:bg-gray-800"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        {loading ? (
          <div className="space-y-2">
            <p className="text-gray-400">Processing audio...</p>
            <div className="w-full bg-gray-700 h-2 rounded overflow-hidden">
              <div className="bg-cyan-500 h-full" style={{ width: '50%' }} />
            </div>
          </div>
        ) : error ? (
          <div className="text-red-400">
            <p className="font-medium mb-1">Error: {error}</p>
            <p className="text-sm text-red-300">Click to try again</p>
          </div>
        ) : (
          <div>
            <p className="text-gray-300 font-medium">📁 Drop your song here</p>
            <p className="text-gray-500 text-sm">or click to browse (MP3, WAV, FLAC)</p>
          </div>
        )}
      </div>
    </div>
  );
}
