'use client';

import { useAudioStore } from '@/lib/audioStore';

export function StructureBar() {
  const sections = useAudioStore((state) => state.sections);
  const words = useAudioStore((state) => state.words);
  const duration = useAudioStore((state) => state.duration);
  const bpm = useAudioStore((state) => state.bpm);

  if (sections.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-400">STRUCTURE</h3>
          {bpm > 0 && <span className="text-xs text-gray-500">BPM: {bpm.toFixed(0)}</span>}
        </div>
        <div className="h-8 bg-[#0a0a0f] border border-gray-800 rounded flex items-center px-4">
          <span className="text-xs text-gray-600">Analyzing song structure...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400">STRUCTURE</h3>
        {bpm > 0 && <span className="text-xs text-gray-500">BPM: {bpm.toFixed(0)}</span>}
      </div>

      <div className="h-8 bg-[#0a0a0f] border border-gray-800 rounded overflow-hidden flex">
        {sections.map((section, index) => {
          const totalWords = words.length;
          const startPercent = (section.startWord / totalWords) * 100;
          const endPercent = ((section.endWord + 1) / totalWords) * 100;
          const width = endPercent - startPercent;

          return (
            <div
              key={index}
              className="flex items-center justify-center text-xs font-medium text-white whitespace-nowrap overflow-hidden"
              style={{
                width: `${width}%`,
                backgroundColor: section.color,
                opacity: 0.75,
              }}
              title={section.label}
            >
              {section.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
