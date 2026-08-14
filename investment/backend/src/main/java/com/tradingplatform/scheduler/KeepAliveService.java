package com.tradingplatform.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@EnableScheduling
public class KeepAliveService {

    private static final Logger log = LoggerFactory.getLogger(KeepAliveService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.keep-alive.enabled:false}")
    private boolean keepAliveEnabled;

    @Value("${app.keep-alive.url:}")
    private String keepAliveUrl;

    // Runs every 14 minutes by default (defined in milliseconds: 14 * 60 * 1000 = 840,000 ms)
    @Scheduled(fixedRateString = "${app.keep-alive.interval-ms:840000}")
    public void pingHealth() {
        if (!keepAliveEnabled) {
            return;
        }

        if (keepAliveUrl == null || keepAliveUrl.trim().isEmpty()) {
            log.warn("Keep-alive enabled but KEEP_ALIVE_URL is not set.");
            return;
        }

        try {
            String targetUrl = keepAliveUrl + "/api/health";
            log.info("Triggering keep-alive health ping to: {}", targetUrl);
            String response = restTemplate.getForObject(targetUrl, String.class);
            log.info("Keep-alive health ping success: {}", response);
        } catch (Exception e) {
            log.error("Failed to run keep-alive health ping: {}", e.getMessage());
        }
    }
}
