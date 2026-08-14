package com.tradingplatform.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "news_sentiment")
public class NewsSentiment {
    @Id
    private String id;

    @Indexed
    private String newsId;
    
    private double sentimentScore; // -1.0 to 1.0
    private double confidence; // 0.0 to 1.0
    private double marketImpact; // 0.0 to 1.0
    private String category;
    private LocalDateTime calculatedAt;
}
