import { useAudioStore } from './audioStore';

export class AudioEngine {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private analyserNode: AnalyserNode;
  private source: AudioBufferSourceNode | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private animationId: number | null = null;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.gainNode = audioContext.createGain();
    this.analyserNode = audioContext.createAnalyser();

    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(audioContext.destination);
  }

  play(buffer: AudioBuffer) {
    if (this.source) {
      this.source.stop();
    }

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = buffer;
    this.source.playbackRate.value = useAudioStore.getState().playbackRate;
    this.source.connect(this.gainNode);

    const pausedTime = useAudioStore.getState().currentTime;
    this.startTime = this.audioContext.currentTime - pausedTime;
    this.source.start(0, pausedTime);

    useAudioStore.setState({ isPlaying: true });
    this.updatePlayhead();
  }

  pause() {
    if (this.source) {
      this.source.stop();
      this.source = null;
    }
    this.pausedTime = this.audioContext.currentTime - this.startTime;
    useAudioStore.setState({ isPlaying: false, currentTime: this.pausedTime });

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }

  seek(time: number) {
    const isPlaying = useAudioStore.getState().isPlaying;
    useAudioStore.setState({ currentTime: time });

    if (isPlaying) {
      this.pause();
      this.play(this.source!.buffer!);
    }
  }

  setPlaybackRate(rate: number) {
    if (this.source) {
      this.source.playbackRate.value = rate;
    }
    useAudioStore.setState({ playbackRate: rate });
  }

  setVolume(volume: number) {
    this.gainNode.gain.value = volume;
    useAudioStore.setState({ volume });
  }

  private updatePlayhead() {
    const updateTime = () => {
      const currentTime = this.audioContext.currentTime - this.startTime;
      const buffer = useAudioStore.getState().audioBuffer;

      if (buffer && currentTime >= buffer.duration) {
        useAudioStore.setState({ isPlaying: false });
        return;
      }

      useAudioStore.setState({ currentTime });
      this.animationId = requestAnimationFrame(updateTime);
    };

    updateTime();
  }

  getAnalyser() {
    return this.analyserNode;
  }

  dispose() {
    this.pause();
  }
}

// Decode audio file
export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return await audioContext.decodeAudioData(arrayBuffer);
}

// Render waveform
export function renderWaveform(
  canvas: HTMLCanvasElement,
  buffer: AudioBuffer,
  zoom: number = 1,
  scroll: number = 0
) {
  const ctx = canvas.getContext('2d')!;
  const width = canvas.width;
  const height = canvas.height;

  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, width, height);

  const samples = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;

  // Calculate visible range
  const duration = buffer.duration;
  const pixelsPerSecond = (width / duration) * zoom;
  const startSample = Math.floor((scroll / zoom) * sampleRate);
  const endSample = Math.floor(((scroll + width / pixelsPerSecond) / zoom) * sampleRate);

  const samplesPerPixel = Math.max(1, Math.floor((endSample - startSample) / width));

  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 1;

  // Draw top channel
  ctx.beginPath();
  for (let i = 0; i < width; i++) {
    const sampleIndex = startSample + i * samplesPerPixel;
    if (sampleIndex >= samples.length) break;

    const sample = samples[sampleIndex];
    const y = height / 4 - sample * (height / 4);

    if (i === 0) ctx.moveTo(i, y);
    else ctx.lineTo(i, y);
  }
  ctx.stroke();

  // Draw center line
  ctx.strokeStyle = '#333344';
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  // Draw playhead
  const store = useAudioStore.getState();
  const playheadX = ((store.currentTime - scroll) * pixelsPerSecond) % width;
  if (playheadX > 0 && playheadX < width) {
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  }
}

// Pre-render spectrogram using OfflineAudioContext
export async function renderSpectrogram(
  buffer: AudioBuffer,
  onProgress?: (progress: number) => void
): Promise<ImageData> {
  const width = 1024;
  const height = 256;
  const fftSize = 2048;

  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;

  const analyser = offlineCtx.createAnalyser();
  analyser.fftSize = fftSize;

  source.connect(analyser);
  analyser.connect(offlineCtx.destination);
  source.start(0);

  const duration = buffer.duration;
  const timePerPixel = duration / width;
  const frequencyData = new Uint8Array(analyser.frequencyBinCount);

  const imageData = new ImageData(width, height);
  const data = imageData.data;

  // Colormap: black → blue → cyan → yellow → white
  const colormap = (value: number): [number, number, number] => {
    if (value < 64) {
      return [0, 0, Math.floor((value / 64) * 100)];
    } else if (value < 128) {
      return [0, Math.floor(((value - 64) / 64) * 255), 255];
    } else if (value < 192) {
      return [Math.floor(((value - 128) / 64) * 255), 255, 255 - Math.floor(((value - 128) / 64) * 100)];
    } else {
      return [255, 255, Math.floor(((value - 192) / 64) * 255)];
    }
  };

  // Render spectrogram by sampling at regular intervals
  for (let x = 0; x < width; x++) {
    const time = x * timePerPixel;
    const sampleIndex = Math.floor(time * buffer.sampleRate);

    // Create a small offline context for analysis
    const chunkSize = Math.min(fftSize, buffer.length - sampleIndex);
    const chunkCtx = new OfflineAudioContext(1, chunkSize, buffer.sampleRate);
    const chunkSource = chunkCtx.createBufferSource();
    const chunkBuffer = chunkCtx.createBuffer(1, chunkSize, buffer.sampleRate);
    const channelData = chunkBuffer.getChannelData(0);

    const originalData = buffer.getChannelData(0);
    for (let i = 0; i < chunkSize; i++) {
      channelData[i] = originalData[sampleIndex + i];
    }

    chunkSource.buffer = chunkBuffer;
    const chunkAnalyser = chunkCtx.createAnalyser();
    chunkAnalyser.fftSize = fftSize;
    chunkSource.connect(chunkAnalyser);
    chunkAnalyser.connect(chunkCtx.destination);
    chunkSource.start(0);

    const freqData = new Uint8Array(chunkAnalyser.frequencyBinCount);
    chunkAnalyser.getByteFrequencyData(freqData);

    for (let y = 0; y < height; y++) {
      const freqIndex = Math.floor((y / height) * freqData.length);
      const magnitude = freqData[freqIndex];
      const [r, g, b] = colormap(magnitude);

      const pixelIndex = (y * width + x) * 4;
      data[pixelIndex] = r;
      data[pixelIndex + 1] = g;
      data[pixelIndex + 2] = b;
      data[pixelIndex + 3] = 255;
    }

    if (onProgress) {
      onProgress((x + 1) / width);
    }
  }

  return imageData;
}
