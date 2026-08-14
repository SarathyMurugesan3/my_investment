package com.tradingplatform.provider;

import com.tradingplatform.model.Candle;
import com.tradingplatform.model.MarketQuote;
import com.tradingplatform.model.OptionContract;
import com.tradingplatform.model.OptionSnapshot;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Component
public class MockMarketDataProvider implements MarketDataProvider {

    private final Random random = new Random();
    private final Map<String, Double> lastPrices = new HashMap<>();

    public MockMarketDataProvider() {
        lastPrices.put("NIFTY", 24300.0);
        lastPrices.put("SENSEX", 79800.0);
        lastPrices.put("BANK NIFTY", 50500.0);
        lastPrices.put("FINNIFTY", 22400.0);
    }

    @Override
    public MarketQuote getQuote(String symbol) {
        double basePrice = lastPrices.getOrDefault(symbol, 100.0);
        
        // Random walk to simulate realistic price movements
        double percentChange = (random.nextDouble() - 0.49) * 0.1; // slight positive bias
        double newPrice = basePrice * (1 + percentChange / 100.0);
        lastPrices.put(symbol, newPrice);

        double prevClose = basePrice * 0.995;

        return MarketQuote.builder()
                .symbol(symbol)
                .exchange("NSE")
                .timestamp(LocalDateTime.now())
                .open(prevClose * 1.001)
                .high(Math.max(newPrice, prevClose * 1.01))
                .low(Math.min(newPrice, prevClose * 0.99))
                .close(newPrice)
                .lastTradedPrice(newPrice)
                .previousClose(prevClose)
                .volume(100000 + random.nextInt(500000))
                .tradedValue((100000 + random.nextInt(500000)) * newPrice)
                .bid(newPrice - 0.05)
                .ask(newPrice + 0.05)
                .bidQuantity(100 + random.nextInt(1000))
                .askQuantity(100 + random.nextInt(1000))
                .marketStatus("OPEN")
                .source("MOCK")
                .build();
    }

    @Override
    public List<Candle> getHistoricalData(String symbol, String timeframe, LocalDateTime from, LocalDateTime to) {
        List<Candle> candles = new ArrayList<>();
        double currentPrice = lastPrices.getOrDefault(symbol, 24000.0);
        
        LocalDateTime current = from;
        int incrementMinutes = switch (timeframe) {
            case "1m" -> 1;
            case "5m" -> 5;
            case "15m" -> 15;
            case "1h" -> 60;
            default -> 1440; // daily
        };

        // Let's create realistic trending patterns (sine waves + noise)
        int index = 0;
        while (current.isBefore(to)) {
            // Trend pattern: some periods up, some down, some sideways
            double cycle = Math.sin(index / 20.0) * 1.5; // slow trend wave
            double noise = (random.nextDouble() - 0.5) * 0.4;
            double pctChange = (cycle + noise) / 100.0;
            
            double open = currentPrice;
            double close = currentPrice * (1 + pctChange);
            double high = Math.max(open, close) * (1 + random.nextDouble() * 0.002);
            double low = Math.min(open, close) * (1 - random.nextDouble() * 0.002);
            long volume = 50000 + random.nextInt(200000);

            candles.add(Candle.builder()
                    .symbol(symbol)
                    .timeframe(timeframe)
                    .timestamp(current)
                    .open(open)
                    .high(high)
                    .low(low)
                    .close(close)
                    .volume(volume)
                    .source("MOCK")
                    .build());

            currentPrice = close;
            current = current.plusMinutes(incrementMinutes);
            index++;
        }
        
        lastPrices.put(symbol, currentPrice);
        return candles;
    }

    @Override
    public OptionSnapshot getOptionChain(String symbol) {
        double spot = lastPrices.getOrDefault(symbol, 24000.0);
        // Round to nearest 50 or 100 strike
        double atm = Math.round(spot / 100.0) * 100.0;
        
        LocalDate nextThursday = LocalDate.now();
        while (nextThursday.getDayOfWeek() != java.time.DayOfWeek.THURSDAY) {
            nextThursday = nextThursday.plusDays(1);
        }

        List<OptionContract> contracts = new ArrayList<>();
        // Generate strikes around ATM (-10 to +10 strikes)
        for (int i = -10; i <= 10; i++) {
            double strike = atm + (i * 100.0);
            
            // CE and PE
            contracts.add(createMockContract(symbol, nextThursday, strike, "CE", spot));
            contracts.add(createMockContract(symbol, nextThursday, strike, "PE", spot));
        }

        double totalCeOi = contracts.stream().filter(c -> c.getType().equals("CE")).mapToLong(OptionContract::getOpenInterest).sum();
        double totalPeOi = contracts.stream().filter(c -> c.getType().equals("PE")).mapToLong(OptionContract::getOpenInterest).sum();

        double oiPcr = totalCeOi > 0 ? totalPeOi / totalCeOi : 1.0;

        return OptionSnapshot.builder()
                .underlying(symbol)
                .timestamp(LocalDateTime.now())
                .spotPrice(spot)
                .pcr(oiPcr)
                .oiPcr(oiPcr)
                .volumePcr(0.9 + random.nextDouble() * 0.2)
                .maxPain(atm)
                .maxPainStrike(atm)
                .distanceToSpot(0.0)
                .atmStrike(atm)
                .source("MOCK")
                .contracts(contracts)
                .build();
    }

    private OptionContract createMockContract(String underlying, LocalDate expiry, double strike, String type, double spot) {
        boolean isITM = (type.equals("CE") && spot > strike) || (type.equals("PE") && spot < strike);
        double dist = Math.abs(spot - strike);
        
        // Calculate dynamic premium
        double basePremium = isITM ? dist + 50.0 + random.nextInt(50) : Math.max(5.0, 150.0 - dist * 1.2);
        long oi = isITM ? 5000 + random.nextInt(15000) : 20000 + random.nextInt(80000);
        long volume = 10000 + random.nextInt(200000);

        // Approximate Black-Scholes Greeks
        double delta = 0.5;
        if (type.equals("CE")) {
            delta = spot > strike ? 0.75 : 0.25;
        } else {
            delta = spot < strike ? -0.75 : -0.25;
        }

        return OptionContract.builder()
                .underlying(underlying)
                .expiry(expiry)
                .strike(strike)
                .type(type)
                .lastTradedPrice(basePremium)
                .change((random.nextDouble() - 0.5) * 10.0)
                .volume(volume)
                .openInterest(oi)
                .changeInOpenInterest((long) ((random.nextDouble() - 0.4) * 5000))
                .impliedVolatility(12.0 + random.nextDouble() * 8.0)
                .delta(delta)
                .gamma(0.001)
                .theta(-5.0 - random.nextDouble() * 5.0)
                .vega(1.5 + random.nextDouble() * 2.0)
                .source("MOCK")
                .build();
    }
}
