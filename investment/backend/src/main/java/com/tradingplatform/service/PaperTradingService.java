package com.tradingplatform.service;

import com.tradingplatform.model.Holding;
import com.tradingplatform.model.PaperTrade;
import com.tradingplatform.model.Portfolio;
import com.tradingplatform.repository.HoldingRepository;
import com.tradingplatform.repository.PaperTradeRepository;
import com.tradingplatform.repository.PortfolioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PaperTradingService {

    @Autowired
    private PortfolioRepository portfolioRepository;

    @Autowired
    private HoldingRepository holdingRepository;

    @Autowired
    private PaperTradeRepository paperTradeRepository;

    public Portfolio getOrCreatePortfolio(String userId) {
        return portfolioRepository.findByUserId(userId)
                .orElseGet(() -> portfolioRepository.save(Portfolio.builder()
                        .userId(userId)
                        .name("Virtual Paper Trading Portfolio")
                        .initialCapital(1000000.0)
                        .virtualBalance(1000000.0)
                        .currentEquity(1000000.0)
                        .maxDrawdown(0.0)
                        .createdAt(LocalDateTime.now())
                        .build()));
    }

    public PaperTrade executePaperTrade(String userId, String symbol, String optionType, double strikePrice, String expiry, String direction, int qty, double price) {
        Portfolio portfolio = getOrCreatePortfolio(userId);
        
        // Transaction charges estimation
        double brokerage = 20.0;
        double stt = (price * qty) * 0.00125; // STT call/put writer/buyer average
        double gst = (brokerage) * 0.18;
        double transactionCosts = brokerage + stt + gst;

        double tradeTotal = price * qty;
        
        if (direction.equalsIgnoreCase("BUY")) {
            if (portfolio.getVirtualBalance() < (tradeTotal + transactionCosts)) {
                throw new IllegalArgumentException("Insufficient virtual balance to execute paper trade.");
            }
            portfolio.setVirtualBalance(portfolio.getVirtualBalance() - (tradeTotal + transactionCosts));
        } else {
            portfolio.setVirtualBalance(portfolio.getVirtualBalance() + (tradeTotal - transactionCosts));
        }

        portfolioRepository.save(portfolio);

        // Record trade
        PaperTrade trade = PaperTrade.builder()
                .portfolioId(portfolio.getId())
                .symbol(symbol)
                .optionType(optionType)
                .strikePrice(strikePrice)
                .expiry(expiry)
                .direction(direction)
                .quantity(qty)
                .entryPrice(price)
                .entryTime(LocalDateTime.now())
                .status("OPEN")
                .transactionCosts(transactionCosts)
                .build();

        paperTradeRepository.save(trade);

        // Update Holdings
        Optional<Holding> existingHolding = holdingRepository
                .findByPortfolioIdAndSymbolAndOptionTypeAndStrikePriceAndExpiry(portfolio.getId(), symbol, optionType, strikePrice, expiry);

        if (existingHolding.isPresent()) {
            Holding holding = existingHolding.get();
            if (direction.equalsIgnoreCase("BUY")) {
                int newQty = holding.getQuantity() + qty;
                double newAvg = ((holding.getAveragePrice() * holding.getQuantity()) + (price * qty)) / newQty;
                holding.setQuantity(newQty);
                holding.setAveragePrice(newAvg);
            } else {
                int newQty = holding.getQuantity() - qty;
                holding.setQuantity(newQty);
                holding.setRealizedPnL(holding.getRealizedPnL() + ((price - holding.getAveragePrice()) * qty) - transactionCosts);
            }
            if (holding.getQuantity() <= 0) {
                holdingRepository.delete(holding);
            } else {
                updateHoldingMetrics(holding, price);
                holdingRepository.save(holding);
            }
        } else if (direction.equalsIgnoreCase("BUY")) {
            Holding holding = Holding.builder()
                    .portfolioId(portfolio.getId())
                    .symbol(symbol)
                    .optionType(optionType)
                    .strikePrice(strikePrice)
                    .expiry(expiry)
                    .quantity(qty)
                    .averagePrice(price)
                    .currentPrice(price)
                    .investedAmount(tradeTotal)
                    .currentMarketValue(tradeTotal)
                    .unrealizedPnL(0.0)
                    .realizedPnL(0.0)
                    .build();
            holdingRepository.save(holding);
        }

        updatePortfolioEquity(portfolio);
        return trade;
    }

    private void updateHoldingMetrics(Holding holding, double currentPrice) {
        holding.setCurrentPrice(currentPrice);
        holding.setCurrentMarketValue(holding.getQuantity() * currentPrice);
        holding.setUnrealizedPnL((currentPrice - holding.getAveragePrice()) * holding.getQuantity());
        holding.setInvestedAmount(holding.getQuantity() * holding.getAveragePrice());
    }

    public void updatePortfolioEquity(Portfolio portfolio) {
        List<Holding> holdings = holdingRepository.findByPortfolioId(portfolio.getId());
        double holdingsValue = holdings.stream().mapToDouble(Holding::getCurrentMarketValue).sum();
        portfolio.setCurrentEquity(portfolio.getVirtualBalance() + holdingsValue);
        portfolioRepository.save(portfolio);
    }
}
