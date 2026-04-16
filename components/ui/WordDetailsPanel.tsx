'use client';

import { useAudioStore } from '@/lib/audioStore';

export function WordDetailsPanel() {
  const selectedWordIndex = useAudioStore((state) => state.selectedWordIndex);
  const words = useAudioStore((state) => state.words);
  const audioBuffer = useAudioStore((state) => state.audioBuffer);
  const replacements = useAudioStore((state) => state.replacements);
  const setSelectedWordIndex = useAudioStore((state) => state.setSelectedWordIndex);
  const addReplacement = useAudioStore((state) => state.addReplacement);
  const removeReplacement = useAudioStore((state) => state.removeReplacement);

  if (selectedWordIndex === null || !words[selectedWordIndex]) {
    return null;
  }

  const word = words[selectedWordIndex];
  const replacement = replacements.find((r) => r.wordIndex === selectedWordIndex);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  const handleMute = () => {
    if (!audioBuffer || !replacement) {
      addReplacement({
        word: word.word,
        wordIndex: selectedWordIndex,
        startTime: word.start,
        endTime: word.end,
        type: 'muted',
        originalBuffer: audioBuffer!.slice(
          Math.floor(word.start * audioBuffer.sampleRate),
          Math.floor(word.end * audioBuffer.sampleRate)
        ),
      });
    } else if (replacement.type === 'muted') {
      removeReplacement(replacements.indexOf(replacement));
    }
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto p-4 space-y-4 z-40">
      {/* Close button */}
      <button
        onClick={() => setSelectedWordIndex(null)}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-300"
      >
        ✕
      </button>

      {/* Word display */}
      <div className="space-y-2 pr-8">
        <h3 className="text-2xl font-bold text-white">{word.word}</h3>
        <p className="text-sm text-gray-500">
          {formatTime(word.start)} → {formatTime(word.end)}
        </p>
        <p className="text-xs text-gray-600">Duration: {(word.end - word.start).toFixed(3)}s</p>
      </div>

      {/* Mini spectrogram placeholder */}
      <div className="bg-gray-800 rounded h-32 flex items-center justify-center text-gray-600">
        <div className="text-center text-sm">
          <p>Mini Spectrogram</p>
          <p className="text-xs text-gray-700">Coming in Phase 2</p>
        </div>
      </div>

      {/* Pitch info placeholder */}
      <div className="bg-gray-800 rounded p-3 text-sm">
        <p className="text-gray-500">Detected Pitch</p>
        <p className="text-white font-mono">Coming in Phase 2</p>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium text-sm transition-colors">
          🎤 Record Replacement
        </button>

        <button
          onClick={handleMute}
          className={`w-full px-4 py-2 rounded font-medium text-sm transition-colors ${
            replacement?.type === 'muted'
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
          }`}
        >
          {replacement?.type === 'muted' ? '🔊 Unmute' : '🔇 Mute Word'}
        </button>

        <button
          disabled={!replacement}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-700 text-gray-200 rounded font-medium text-sm transition-colors"
        >
          ↩ Reset
        </button>
      </div>

      {/* Replacements history */}
      <div className="space-y-2 pt-4 border-t border-gray-800">
        <h4 className="text-xs font-semibold text-gray-400 uppercase">Replacements</h4>
        {replacements.length === 0 ? (
          <p className="text-xs text-gray-600">No replacements yet</p>
        ) : (
          <div className="space-y-1">
            {replacements.map((r, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs p-2 bg-gray-800 rounded"
              >
                <span className="text-gray-300">
                  <strong>{r.word}</strong> ({r.type})
                </span>
                <button
                  onClick={() => removeReplacement(index)}
                  className="text-gray-500 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
