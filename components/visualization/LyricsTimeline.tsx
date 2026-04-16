'use client';

import { useAudioStore } from '@/lib/audioStore';

export function LyricsTimeline() {
  const words = useAudioStore((state) => state.words);
  const currentTime = useAudioStore((state) => state.currentTime);
  const duration = useAudioStore((state) => state.duration);
  const selectedWordIndex = useAudioStore((state) => state.selectedWordIndex);
  const sections = useAudioStore((state) => state.sections);
  const setSelectedWordIndex = useAudioStore((state) => state.setSelectedWordIndex);

  if (words.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400">LYRICS TIMELINE</h3>
        <div className="text-gray-600 text-sm p-4 rounded border border-gray-800">
          Upload a song and transcribe to see lyrics
        </div>
      </div>
    );
  }

  const getSectionColor = (wordIndex: number) => {
    const section = sections.find(
      (s) => wordIndex >= s.startWord && wordIndex <= s.endWord
    );
    return section?.color || '#6b7280';
  };

  const isWordPlaying = (wordIndex: number) => {
    const word = words[wordIndex];
    return currentTime >= word.start && currentTime < word.end;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-400">LYRICS TIMELINE</h3>
      <div className="relative h-16 bg-[#0a0a0f] border border-gray-800 rounded overflow-x-auto">
        <div className="relative h-full p-2" style={{ width: `${(duration / duration) * 100}%` }}>
          {words.map((word, index) => {
            const startPercent = (word.start / duration) * 100;
            const widthPercent = ((word.end - word.start) / duration) * 100;
            const isSelected = selectedWordIndex === index;
            const isPlaying = isWordPlaying(index);
            const sectionColor = getSectionColor(index);

            return (
              <button
                key={index}
                onClick={() => setSelectedWordIndex(isSelected ? null : index)}
                className={`absolute top-2 px-2 py-1 rounded text-xs font-medium transition-all whitespace-nowrap overflow-hidden text-ellipsis ${
                  isSelected
                    ? 'ring-2 ring-purple-500 bg-purple-900'
                    : isPlaying
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
                style={{
                  left: `${startPercent}%`,
                  width: `max(40px, ${widthPercent}%)`,
                  backgroundColor: isSelected ? '#7c3aed' : isPlaying ? '#06b6d4' : sectionColor,
                  opacity: 0.8,
                }}
              >
                {word.word}
              </button>
            );
          })}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-amber-500"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
