import { NextResponse } from 'next/server';
import { DeckSpecSchema } from '@/lib/schemas/deckspec';
import { generatePptx } from '@/lib/pptx/generator';

function toSafeFilename(title: string): string {
    const base = title
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80);
    return (base || 'presentation').replace(/\s/g, '_');
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = DeckSpecSchema.safeParse(body.deckSpec || body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid deck specification', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const buffer = await generatePptx(parsed.data);
        const uint8 = new Uint8Array(buffer);

        const safeBase = toSafeFilename(parsed.data.title);
        const filename = `${safeBase}.pptx`;
        const encodedFilename = encodeURIComponent(filename);

        return new NextResponse(uint8, {
            status: 200,
            headers: {
                'Content-Type':
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
                'Content-Length': String(uint8.byteLength),
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error('Export route error:', error);
        return NextResponse.json(
            { error: 'Failed to generate PPTX file.' },
            { status: 500 }
        );
    }
}
