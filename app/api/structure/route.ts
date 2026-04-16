import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface SongSection {
  label: string;
  startWord: number;
  endWord: number;
  color: string;
}

const COLORS = [
  '#8b5cf6', // purple (intro)
  '#ec4899', // pink (verse)
  '#f59e0b', // amber (pre-chorus)
  '#ef4444', // red (chorus)
  '#06b6d4', // cyan (bridge)
  '#10b981', // green (outro)
];

export async function POST(request: NextRequest) {
  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }

    const { words } = await request.json();

    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: 'Invalid words input' },
        { status: 400 }
      );
    }

    // Build lyrics text
    const lyrics = words.map((w) => w.word).join(' ');

    // Call Claude API directly
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1-20250805',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Analyze this song lyrics and identify the song structure sections (intro, verse, pre-chorus, chorus, bridge, outro).

Return ONLY a valid JSON array with no markdown formatting, no code blocks, no explanation. Each object must have exactly these fields:
- "label": string (e.g. "Verse 1", "Chorus", "Bridge")
- "startWord": number (index of first word in this section)
- "endWord": number (index of last word in this section, inclusive)

Lyrics (${words.length} words):
${lyrics}

Return the JSON array only, nothing else.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    const responseText = data.content[0]?.text || '';

    // Extract JSON from response
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const parsedSections = JSON.parse(jsonStr);

    // Add colors
    const sections: SongSection[] = parsedSections.map(
      (section: any, index: number) => ({
        label: section.label,
        startWord: Math.max(0, section.startWord),
        endWord: Math.min(words.length - 1, section.endWord),
        color: COLORS[index % COLORS.length],
      })
    );

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Structure detection error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
