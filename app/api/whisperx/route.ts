import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;

interface WhisperXResponse {
  word: string;
  start: number;
  end: number;
  speaker?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Save file to temp directory
    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `audio-${Date.now()}.wav`);
    const buffer = await file.arrayBuffer();
    fs.writeFileSync(tmpFile, Buffer.from(buffer));

    // Call Replicate API
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'victor-upmeet/whisperx',
        input: {
          audio: fs.readFileSync(tmpFile),
          language: 'en',
          align_output: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.statusText}`);
    }

    const prediction = await response.json();
    let predictionId = prediction.id;

    // Poll for completion
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${REPLICATE_API_KEY}`,
          },
        }
      );

      const statusData = await statusResponse.json();
      if (statusData.status === 'succeeded') {
        // Extract words from segments
        const words: WhisperXResponse[] = [];
        const segments = statusData.output?.segments || [];

        for (const segment of segments) {
          if (segment.words) {
            for (const word of segment.words) {
              words.push({
                word: word.word.trim(),
                start: word.start,
                end: word.end,
                speaker: segment.speaker,
              });
            }
          }
        }

        // Clean up
        fs.unlinkSync(tmpFile);

        return NextResponse.json({ words });
      } else if (statusData.status === 'failed') {
        throw new Error('WhisperX transcription failed');
      }
    }

    // Fallback (should not reach here)
    fs.unlinkSync(tmpFile);
    return NextResponse.json({ error: 'Transcription timeout' }, { status: 500 });
  } catch (error) {
    console.error('WhisperX error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
