import { NextRequest, NextResponse } from 'next/server';

const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;

interface WhisperXResponse {
  word: string;
  start: number;
  end: number;
  speaker?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not set');
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:audio/mpeg;base64,${base64}`;

    // Create prediction
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'victor-upmeet/whisperx:1.2.1',
        input: {
          audio: dataUrl,
          language: 'en',
          align_output: true,
          batch_size: 24,
        },
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create prediction: ${error}`);
    }

    const prediction = await createResponse.json();
    const predictionId = prediction.id;

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes max

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${REPLICATE_API_KEY}`,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error(`Failed to check status: ${statusResponse.statusText}`);
      }

      const statusData = await statusResponse.json();

      if (statusData.status === 'succeeded') {
        // Extract words from segments
        const words: WhisperXResponse[] = [];
        const segments = statusData.output?.segments || [];

        for (const segment of segments) {
          if (segment.words) {
            for (const wordObj of segment.words) {
              words.push({
                word: wordObj.word.trim(),
                start: wordObj.start,
                end: wordObj.end,
                speaker: segment.speaker,
              });
            }
          }
        }

        return NextResponse.json({ words });
      } else if (statusData.status === 'failed') {
        const error = statusData.error || 'Unknown error';
        throw new Error(`Transcription failed: ${error}`);
      }

      // Still processing
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('Transcription timeout after 2 minutes');
  } catch (error) {
    console.error('WhisperX error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
