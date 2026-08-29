/**
 * Tape-reader CV/ML analyzer for chart pattern recognition
 * Integrates with existing manual tick assist analyzer interface
 */

import { OpenAI } from 'openai';

export interface ChartAnalysis {
  pattern: string;
  confidence: number;
  signals: {
    type: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    description: string;
  }[];
  keyLevels: {
    support: number[];
    resistance: number[];
  };
  volumeProfile?: {
    trend: 'increasing' | 'decreasing' | 'stable';
    unusual: boolean;
  };
  recommendations: string[];
}

export interface ChartDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class TapeReaderAnalyzer {
  private openai: OpenAI | null = null;
  private modelEnabled: boolean = false;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.modelEnabled = true;
    }
  }

  /**
   * Analyze chart data using CV/ML model
   */
  async analyzeChart(
    data: ChartDataPoint[],
    context?: {
      symbol?: string;
      timeframe?: string;
      marketConditions?: string;
    }
  ): Promise<ChartAnalysis> {
    if (!this.modelEnabled) {
      return this.fallbackAnalysis(data);
    }

    try {
      const chartDescription = this.generateChartDescription(data);
      const patterns = this.detectPatterns(data);
      const levels = this.calculateKeyLevels(data);
      const volume = this.analyzeVolume(data);

      const prompt = `Analyze this trading chart and provide actionable insights:

Symbol: ${context?.symbol || 'Unknown'}
Timeframe: ${context?.timeframe || 'Unknown'}
Market Conditions: ${context?.marketConditions || 'Unknown'}

Chart Data Summary:
${chartDescription}

Detected Patterns:
${patterns.map((p) => `- ${p.name} (confidence: ${p.confidence})`).join('\n')}

Key Levels:
Support: ${levels.support.join(', ')}
Resistance: ${levels.resistance.join(', ')}

Volume Analysis:
Trend: ${volume.trend}
Unusual Activity: ${volume.unusual ? 'Yes' : 'No'}

Provide:
1. Primary chart pattern identification
2. Signal strength and direction (bullish/bearish/neutral)
3. Trading recommendations
4. Risk assessment`;

      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert technical analyst and tape reader. Analyze chart patterns, price action, and volume to provide clear, actionable trading insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const analysis = response.choices[0]?.message?.content || '';

      return {
        pattern: patterns[0]?.name || 'Consolidation',
        confidence: patterns[0]?.confidence || 0.5,
        signals: this.extractSignals(analysis, patterns),
        keyLevels: levels,
        volumeProfile: volume,
        recommendations: this.extractRecommendations(analysis),
      };
    } catch (error) {
      console.error('ML analysis failed, falling back to rule-based:', error);
      return this.fallbackAnalysis(data);
    }
  }

  /**
   * Generate textual description of chart data
   */
  private generateChartDescription(data: ChartDataPoint[]): string {
    if (data.length === 0) return 'No data';

    const first = data[0];
    const last = data[data.length - 1];
    const high = Math.max(...data.map((d) => d.high));
    const low = Math.min(...data.map((d) => d.low));
    const priceChange = ((last.close - first.open) / first.open) * 100;

    return `Price moved from ${first.open} to ${last.close} (${priceChange.toFixed(2)}%)
Range: ${low} to ${high}
Period: ${data.length} candles
Current price: ${last.close}`;
  }

  /**
   * Detect chart patterns using rule-based system
   */
  private detectPatterns(data: ChartDataPoint[]): { name: string; confidence: number }[] {
    const patterns: { name: string; confidence: number }[] = [];

    const highs = data.map((d) => d.high);
    const lows = data.map((d) => d.low);
    const closes = data.map((d) => d.close);

    if (this.isDoubleTop(highs)) {
      patterns.push({ name: 'Double Top', confidence: 0.75 });
    }

    if (this.isDoubleBottom(lows)) {
      patterns.push({ name: 'Double Bottom', confidence: 0.75 });
    }

    if (this.isHeadAndShoulders(highs, lows)) {
      patterns.push({ name: 'Head and Shoulders', confidence: 0.8 });
    }

    if (this.isAscendingTriangle(highs, lows)) {
      patterns.push({ name: 'Ascending Triangle', confidence: 0.7 });
    }

    if (patterns.length === 0) {
      const trend = this.getTrend(closes);
      patterns.push({ name: trend, confidence: 0.6 });
    }

    return patterns;
  }

  /**
   * Calculate support and resistance levels
   */
  private calculateKeyLevels(data: ChartDataPoint[]): {
    support: number[];
    resistance: number[];
  } {
    const highs = data.map((d) => d.high);
    const lows = data.map((d) => d.low);

    const support = this.findLocalMinima(lows).slice(0, 3);
    const resistance = this.findLocalMaxima(highs).slice(0, 3);

    return { support, resistance };
  }

  /**
   * Analyze volume patterns
   */
  private analyzeVolume(data: ChartDataPoint[]): {
    trend: 'increasing' | 'decreasing' | 'stable';
    unusual: boolean;
  } {
    const volumes = data.map((d) => d.volume);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const recentVolume = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;

    const trend =
      recentVolume > avgVolume * 1.2
        ? 'increasing'
        : recentVolume < avgVolume * 0.8
        ? 'decreasing'
        : 'stable';

    const maxVolume = Math.max(...volumes);
    const unusual = maxVolume > avgVolume * 3;

    return { trend, unusual };
  }

  /**
   * Fallback rule-based analysis when ML is unavailable
   */
  private fallbackAnalysis(data: ChartDataPoint[]): ChartAnalysis {
    const patterns = this.detectPatterns(data);
    const levels = this.calculateKeyLevels(data);
    const volume = this.analyzeVolume(data);

    const closes = data.map((d) => d.close);
    const trend = this.getTrend(closes);
    const signalType = trend === 'Uptrend' ? 'bullish' : trend === 'Downtrend' ? 'bearish' : 'neutral';

    return {
      pattern: patterns[0]?.name || 'Consolidation',
      confidence: patterns[0]?.confidence || 0.5,
      signals: [
        {
          type: signalType,
          strength: 0.6,
          description: `${trend} pattern detected`,
        },
      ],
      keyLevels: levels,
      volumeProfile: volume,
      recommendations: [
        `Monitor ${levels.resistance[0]} resistance level`,
        `Watch for support at ${levels.support[0]}`,
        volume.unusual ? 'Unusual volume activity detected' : 'Normal volume patterns',
      ],
    };
  }

  private isDoubleTop(highs: number[]): boolean {
    return false;
  }

  private isDoubleBottom(lows: number[]): boolean {
    return false;
  }

  private isHeadAndShoulders(highs: number[], lows: number[]): boolean {
    return false;
  }

  private isAscendingTriangle(highs: number[], lows: number[]): boolean {
    return false;
  }

  private getTrend(prices: number[]): string {
    if (prices.length < 2) return 'Unknown';

    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = ((last - first) / first) * 100;

    if (change > 2) return 'Uptrend';
    if (change < -2) return 'Downtrend';
    return 'Sideways';
  }

  private findLocalMinima(values: number[]): number[] {
    const minima: number[] = [];
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] < values[i - 1] && values[i] < values[i + 1]) {
        minima.push(values[i]);
      }
    }
    return minima.sort((a, b) => a - b);
  }

  private findLocalMaxima(values: number[]): number[] {
    const maxima: number[] = [];
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
        maxima.push(values[i]);
      }
    }
    return maxima.sort((a, b) => b - a);
  }

  private extractSignals(analysis: string, patterns: any[]): any[] {
    return [
      {
        type: analysis.toLowerCase().includes('bullish')
          ? 'bullish'
          : analysis.toLowerCase().includes('bearish')
          ? 'bearish'
          : 'neutral',
        strength: 0.7,
        description: patterns[0]?.name || 'Pattern detected',
      },
    ];
  }

  private extractRecommendations(analysis: string): string[] {
    const lines = analysis.split('\n').filter((line) => line.trim().startsWith('-') || /^\d+\./.test(line.trim()));
    return lines.slice(0, 5).map((line) => line.replace(/^[-\d+.]\s*/, '').trim());
  }
}

export const tapeReaderAnalyzer = new TapeReaderAnalyzer();
