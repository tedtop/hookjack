import { create } from 'zustand';

export interface WordSegment {
  word: string;
  start: number;
  end: number;
  speaker?: string;
}

export interface SongSection {
  label: string;
  startWord: number;
  endWord: number;
  color: string;
}

export interface Replacement {
  word: string;
  wordIndex: number;
  startTime: number;
  endTime: number;
  type: 'muted' | 'replaced';
  originalBuffer?: AudioBuffer;
  replacementBuffer?: AudioBuffer;
}

export interface AudioState {
  audioBuffer: AudioBuffer | null;
  audioContext: AudioContext | null;

  // Song metadata
  title: string;
  duration: number;
  sampleRate: number;

  // Playback state
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
  volume: number;

  // Lyrics and structure
  words: WordSegment[];
  sections: SongSection[];
  bpm: number;

  // Selection and editing
  selectedWordIndex: number | null;
  replacements: Replacement[];

  // Visualization
  spectrogramData: ImageData | null;
  waveformZoom: number;
  waveformScroll: number;

  // Actions
  setAudioBuffer: (buffer: AudioBuffer) => void;
  setAudioContext: (ctx: AudioContext) => void;
  setTitle: (title: string) => void;
  setDuration: (duration: number) => void;
  setSampleRate: (rate: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  setWords: (words: WordSegment[]) => void;
  setSections: (sections: SongSection[]) => void;
  setBpm: (bpm: number) => void;
  setSelectedWordIndex: (index: number | null) => void;
  setSpectrogramData: (data: ImageData | null) => void;
  setWaveformZoom: (zoom: number) => void;
  setWaveformScroll: (scroll: number) => void;
  addReplacement: (replacement: Replacement) => void;
  updateReplacement: (index: number, replacement: Partial<Replacement>) => void;
  removeReplacement: (index: number) => void;
  reset: () => void;
}

const initialState = {
  audioBuffer: null,
  audioContext: null,
  title: '',
  duration: 0,
  sampleRate: 0,
  isPlaying: false,
  currentTime: 0,
  playbackRate: 1,
  volume: 0.8,
  words: [],
  sections: [],
  bpm: 0,
  selectedWordIndex: null,
  replacements: [],
  spectrogramData: null,
  waveformZoom: 1,
  waveformScroll: 0,
};

export const useAudioStore = create<AudioState>((set) => ({
  ...initialState,

  setAudioBuffer: (buffer) => set({ audioBuffer: buffer }),
  setAudioContext: (ctx) => set({ audioContext: ctx }),
  setTitle: (title) => set({ title }),
  setDuration: (duration) => set({ duration }),
  setSampleRate: (rate) => set({ sampleRate: rate }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setVolume: (volume) => set({ volume }),
  setWords: (words) => set({ words }),
  setSections: (sections) => set({ sections }),
  setBpm: (bpm) => set({ bpm }),
  setSelectedWordIndex: (index) => set({ selectedWordIndex: index }),
  setSpectrogramData: (data) => set({ spectrogramData: data }),
  setWaveformZoom: (zoom) => set({ waveformZoom: zoom }),
  setWaveformScroll: (scroll) => set({ waveformScroll: scroll }),

  addReplacement: (replacement) =>
    set((state) => ({ replacements: [...state.replacements, replacement] })),

  updateReplacement: (index, updates) =>
    set((state) => ({
      replacements: state.replacements.map((r, i) =>
        i === index ? { ...r, ...updates } : r
      ),
    })),

  removeReplacement: (index) =>
    set((state) => ({
      replacements: state.replacements.filter((_, i) => i !== index),
    })),

  reset: () => set(initialState),
}));
