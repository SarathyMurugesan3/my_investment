package com.tradingplatform.controller;

import com.tradingplatform.service.MarketDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private MarketDataService marketDataService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "trading-analysis-backend");
        health.put("timestamp", LocalDateTime.now().toString());

        // Simple database check
        try {
            mongoTemplate.executeCommand("{ping:1}");
            health.put("database", "UP");
        } catch (Exception e) {
            health.put("database", "DOWN");
            health.put("dbError", e.getMessage());
        }

        health.put("marketDataProvider", marketDataService.getProviderName());
        health.put("newsProvider", "MOCK");

        return ResponseEntity.ok(health);
    }

    @GetMapping("/database")
    public ResponseEntity<Map<String, Object>> getDatabaseHealth() {
        Map<String, Object> dbHealth = new HashMap<>();
        try {
            mongoTemplate.executeCommand("{ping:1}");
            dbHealth.put("database", "UP");
            dbHealth.put("latency", "OK");
        } catch (Exception e) {
            dbHealth.put("database", "DOWN");
            dbHealth.put("error", e.getMessage());
        }
        return ResponseEntity.ok(dbHealth);
    }
}
