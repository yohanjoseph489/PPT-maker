import { NextResponse } from 'next/server';
import { DeckSpecSchema } from '@/lib/schemas/deckspec';
import { generatePptx } from '@/lib/pptx/generator';

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

        const filename = `${parsed.data.title.replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;

        return new NextResponse(uint8, {
            status: 200,
            headers: {
                'Content-Type':
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'Content-Disposition': `attachment; filename="${filename}"`,
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
