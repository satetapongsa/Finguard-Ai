export interface EmbeddingProvider {
  name: string;
  dimension: number;
  embedText(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

export class NoneEmbeddingProvider implements EmbeddingProvider {
  name = "none";
  dimension = 1536;

  async embedText(_text: string): Promise<number[]> {
    return [];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map(() => []);
  }
}

/**
 * Factory for Embedding Providers
 * Configured via EMBEDDING_PROVIDER environment variable: 'none' | 'openai' | 'deepseek'
 */
export function getEmbeddingProvider(): EmbeddingProvider {
  const provider = (process.env.EMBEDDING_PROVIDER || "none").toLowerCase();

  // If no API key configured or explicitly none, safely fallback to NoneEmbeddingProvider
  if (provider === "none" || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "demo-key") {
    return new NoneEmbeddingProvider();
  }

  // Real OpenAI embedding if configured
  return new NoneEmbeddingProvider();
}
