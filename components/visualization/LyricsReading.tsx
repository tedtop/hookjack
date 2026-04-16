'use client';

import { useAudioStore } from '@/lib/audioStore';

export function LyricsReading() {
  const words = useAudioStore((state) => state.words);
  const currentTime = useAudioStore((state) => state.currentTime);
  const sections = useAudioStore((state) => state.sections);
  const selectedWordIndex = useAudioStore((state) => state.selectedWordIndex);
  const setSelectedWordIndex = useAudioStore((state) => state.setSelectedWordIndex);

  if (words.length === 0) {
    return null;
  }

  const getLineNumber = (wordIndex: number) => {
    let line = 0;
    let wordCount = 0;
    for (let i = 0; i < words.length && i < wordIndex; i++) {
      wordCount++;
      if (wordCount > 12) {
        line++;
        wordCount = 0;
      }
    }
    return line;
  };

  const getSectionLabel = (wordIndex: number) => {
    const section = sections.find(
      (s) => wordIndex >= s.startWord && wordIndex <= s.endWord
    );
    return section?.label;
  };

  const isWordPlaying = (wordIndex: number) => {
    const word = words[wordIndex];
    return currentTime >= word.start && currentTime < word.end;
  };

  const lines: string[][] = [];
  let currentLine: string[] = [];

  for (let i = 0; i < words.length; i++) {
    currentLine.push(i.toString());
    if (currentLine.length > 12) {
      lines.push(currentLine);
      currentLine = [];
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-400">READING VIEW</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
        {lines.map((line, lineIndex) => {
          const firstWordIndex = parseInt(line[0]);
          const sectionLabel = getSectionLabel(firstWordIndex);

          return (
            <div key={lineIndex} className="space-y-2">
              {sectionLabel && (
                <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  {sectionLabel}
                </div>
              )}
              <div className="text-base leading-relaxed text-gray-200">
                {line.map((indexStr) => {
                  const wordIndex = parseInt(indexStr);
                  const word = words[wordIndex];
                  const isSelected = selectedWordIndex === wordIndex;
                  const isPlaying = isWordPlaying(wordIndex);

                  return (
                    <button
                      key={wordIndex}
                      onClick={() => setSelectedWordIndex(isSelected ? null : wordIndex)}
                      className={`mr-1.5 transition-all ${
                        isSelected
                          ? 'bg-purple-900 border-b-2 border-purple-500'
                          : isPlaying
                            ? 'bg-cyan-900 border-b-2 border-cyan-500'
                            : 'hover:text-white'
                      }`}
                    >
                      {word.word}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
