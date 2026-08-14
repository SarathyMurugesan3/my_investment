# News API Integration

Sentiment scores are calculated via:
1. Rule-based lexical fallback analyzer (`NewsSentimentService`).
2. External news feeds when a `NEWS_API_KEY` is provided.

For custom NLP integration:
- Replace the stub implementation in `NewsSentimentService` with an active model adapter.
- Provide `NEWS_API_KEY` environment configuration to activate API news loaders.
