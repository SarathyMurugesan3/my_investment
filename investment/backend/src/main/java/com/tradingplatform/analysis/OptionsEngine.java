package com.tradingplatform.analysis;

import com.tradingplatform.model.OptionContract;
import com.tradingplatform.model.OptionSnapshot;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
public class OptionsEngine {

    public OptionSnapshot analyzeOptionChain(String underlying, double spot, List<OptionContract> contracts) {
        if (contracts == null || contracts.isEmpty()) {
            throw new IllegalArgumentException("Contracts list cannot be null or empty for options analysis.");
        }

        // 1. Calculate Implied Volatility and Greeks using Black-Scholes formula
        for (OptionContract contract : contracts) {
            calculateGreeks(contract, spot);
        }

        // 2. Max Pain calculation
        double maxPainStrike = calculateMaxPain(contracts);

        // 3. Put-Call Ratio (PCR)
        long totalCeOi = contracts.stream().filter(c -> c.getType().equals("CE")).mapToLong(OptionContract::getOpenInterest).sum();
        long totalPeOi = contracts.stream().filter(c -> c.getType().equals("PE")).mapToLong(OptionContract::getOpenInterest).sum();
        long totalCeVol = contracts.stream().filter(c -> c.getType().equals("CE")).mapToLong(OptionContract::getVolume).sum();
        long totalPeVol = contracts.stream().filter(c -> c.getType().equals("PE")).mapToLong(OptionContract::getVolume).sum();

        double oiPcr = totalCeOi > 0 ? (double) totalPeOi / totalCeOi : 0.0;
        double volumePcr = totalCeVol > 0 ? (double) totalPeVol / totalCeVol : 0.0;
        double combinedPcr = (oiPcr + volumePcr) / 2.0;

        // Round to nearest strike for ATM strike
        double atmStrike = Math.round(spot / 100.0) * 100.0;

        return OptionSnapshot.builder()
                .underlying(underlying)
                .timestamp(java.time.LocalDateTime.now())
                .spotPrice(spot)
                .pcr(combinedPcr)
                .oiPcr(oiPcr)
                .volumePcr(volumePcr)
                .maxPain(maxPainStrike)
                .maxPainStrike(maxPainStrike)
                .distanceToSpot(Math.abs(spot - maxPainStrike))
                .atmStrike(atmStrike)
                .source("MOCK")
                .contracts(contracts)
                .build();
    }

    private void calculateGreeks(OptionContract contract, double spot) {
        double K = contract.getStrike();
        double T = 7.0 / 365.0; // Assume 7 days to expiry for simplicity
        double r = 0.07; // 7% risk free rate
        double sigma = contract.getImpliedVolatility() / 100.0;

        if (sigma <= 0) sigma = 0.15; // default 15% IV

        double d1 = (Math.log(spot / K) + (r + (sigma * sigma) / 2.0) * T) / (sigma * Math.sqrt(T));
        double d2 = d1 - sigma * Math.sqrt(T);

        double nd1 = normalCDF(d1);
        double nd2 = normalCDF(d2);
        
        // phi(d1) - normal PDF
        double phiD1 = Math.exp(-d1 * d1 / 2.0) / Math.sqrt(2.0 * Math.PI);

        double delta;
        double theta;
        
        if (contract.getType().equalsIgnoreCase("CE")) {
            delta = nd1;
            theta = -(spot * phiD1 * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * nd2;
        } else {
            delta = nd1 - 1.0;
            theta = -(spot * phiD1 * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * normalCDF(-d2);
        }

        double gamma = phiD1 / (spot * sigma * Math.sqrt(T));
        double vega = spot * phiD1 * Math.sqrt(T) / 100.0;

        contract.setDelta(delta);
        contract.setGamma(gamma);
        contract.setTheta(theta / 365.0); // theta per day
        contract.setVega(vega);
    }

    private double normalCDF(double x) {
        // Standard normal cumulative distribution approximation (Abramowitz and Stegun)
        double t = 1.0 / (1.0 + 0.2316419 * Math.abs(x));
        double d = 0.3989422804;
        double probs = 1.0 - d * Math.exp(-x * x / 2.0) * t *
                (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
        if (x > 0) return probs;
        return 1.0 - probs;
    }

    private double calculateMaxPain(List<OptionContract> contracts) {
        // Get all unique strikes
        List<Double> strikes = contracts.stream()
                .map(OptionContract::getStrike)
                .distinct()
                .toList();

        double minLoss = Double.MAX_VALUE;
        double maxPainStrike = strikes.isEmpty() ? 24000.0 : strikes.getFirst();

        for (double candidateStrike : strikes) {
            double totalLoss = 0.0;
            for (OptionContract contract : contracts) {
                double payoff = 0.0;
                if (contract.getType().equals("CE")) {
                    if (candidateStrike > contract.getStrike()) {
                        payoff = candidateStrike - contract.getStrike();
                    }
                } else if (contract.getType().equals("PE")) {
                    if (candidateStrike < contract.getStrike()) {
                        payoff = contract.getStrike() - candidateStrike;
                    }
                }
                totalLoss += payoff * contract.getOpenInterest();
            }

            if (totalLoss < minLoss) {
                minLoss = totalLoss;
                maxPainStrike = candidateStrike;
            }
        }
        return maxPainStrike;
    }
}
