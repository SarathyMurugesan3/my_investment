package com.tradingplatform.controller;

import com.tradingplatform.model.Candle;
import com.tradingplatform.model.MarketQuote;
import com.tradingplatform.service.MarketDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class MarketDataController {

    @Autowired
    private MarketDataService marketDataService;

    @GetMapping("/market/{symbol}")
    public ResponseEntity<MarketQuote> getQuote(@PathVariable String symbol) {
        return ResponseEntity.ok(marketDataService.getLatestQuote(symbol.toUpperCase()));
    }

    @GetMapping("/candles/{symbol}")
    public ResponseEntity<List<Candle>> getCandles(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "15m") String timeframe,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {

        LocalDateTime fromTime = from != null ? LocalDateTime.parse(from) : LocalDateTime.now().minusDays(5);
        LocalDateTime toTime = to != null ? LocalDateTime.parse(to) : LocalDateTime.now();

        return ResponseEntity.ok(marketDataService.getHistoricalCandles(symbol.toUpperCase(), timeframe, fromTime, toTime));
    }
}
