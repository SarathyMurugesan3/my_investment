package com.tradingplatform.controller;

import com.tradingplatform.model.PaperTrade;
import com.tradingplatform.model.Portfolio;
import com.tradingplatform.service.PaperTradingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class PaperTradingController {

    @Autowired
    private PaperTradingService paperTradingService;

    @GetMapping("/portfolio")
    public ResponseEntity<Portfolio> getPortfolio(@RequestParam(defaultValue = "user1") String userId) {
        return ResponseEntity.ok(paperTradingService.getOrCreatePortfolio(userId));
    }

    @PostMapping("/paper-trade")
    public ResponseEntity<PaperTrade> executeTrade(
            @RequestParam(defaultValue = "user1") String userId,
            @RequestBody Map<String, Object> body) {

        String symbol = (String) body.get("symbol");
        String optionType = (String) body.get("optionType");
        double strikePrice = Double.parseDouble(body.get("strikePrice").toString());
        String expiry = (String) body.get("expiry");
        String direction = (String) body.get("direction");
        int qty = Integer.parseInt(body.get("quantity").toString());
        double price = Double.parseDouble(body.get("price").toString());

        PaperTrade trade = paperTradingService.executePaperTrade(
                userId, symbol, optionType, strikePrice, expiry, direction, qty, price);
                
        return ResponseEntity.ok(trade);
    }
}
