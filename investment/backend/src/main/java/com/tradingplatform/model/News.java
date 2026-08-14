package com.tradingplatform.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "news")
public class News {
    @Id
    private String id;

    private String headline;
    private String source; // e.g. Moneycontrol, Bloomberg
    private String url;
    
    @Indexed(name = "publishedAt_idx")
    private LocalDateTime publishedAt;
    
    private String summary;
    private List<String> relatedCompanies;
    private List<String> relatedSectors;
    private double marketRelevance; // 0 to 1

    private String sentiment; // POSITIVE, NEGATIVE, NEUTRAL
    private double sentimentScore; // -1.0 to +1.0
    private double confidence; // 0 to 1
    private String impact; // LOW, MEDIUM, HIGH, CRITICAL
    private double marketImpactScore; // 0 to 1
    private String category; // RBI, Fed, Crude, Earnings, etc.
}
