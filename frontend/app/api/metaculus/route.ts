import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const METACULUS_API = 'https://www.metaculus.com/api2';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));

  try {
    const response = await fetch(
      `${METACULUS_API}/questions/?limit=${limit}&status=open&type=forecast&order_by=-activity`,
      {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'TruthBounty/1.0',
        },
        signal: AbortSignal.timeout(15000),
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error(`Metaculus API error: ${response.status}`);
    }

    const data = await response.json();
    const rawQuestions = data.results || [];
    
    const markets = rawQuestions
      .filter((q: any) => q.question?.type === 'binary' && !q.resolved)
      .slice(0, limit)
      .map((q: any) => {
        const aggregation = q.question?.aggregations?.recency_weighted?.latest;
        const prob = aggregation?.centers?.[0] || 0.5;
        
        return {
          id: `meta-${q.id}`,
          questionId: q.id,
          title: q.title || q.question?.title,
          description: q.description?.slice(0, 300),
          category: q.projects?.category?.[0]?.name || 'Forecasting',
          outcomes: [
            { id: 'yes', name: 'Yes', odds: prob > 0.01 ? 1 / prob : 100, probability: prob },
            { id: 'no', name: 'No', odds: (1-prob) > 0.01 ? 1 / (1-prob) : 100, probability: 1 - prob },
          ],
          status: 'open',
          communityPrediction: prob,
          numForecasters: q.nr_forecasters || aggregation?.forecaster_count || 0,
          closeTime: q.scheduled_close_time ? new Date(q.scheduled_close_time).getTime() : undefined,
          url: `https://www.metaculus.com/questions/${q.id}`,
        };
      });

    return NextResponse.json({
      success: true,
      data: markets,
      count: markets.length,
      totalAvailable: data.count || markets.length,
      isMock: false,
      platform: 'Metaculus',
      chain: 'Off-chain',
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Metaculus API error:', error);
    return NextResponse.json({
      success: false,
      data: [],
      count: 0,
      isMock: false,
      platform: 'Metaculus',
      error: error.message,
      timestamp: Date.now(),
    }, { status: 503 });
  }
}
