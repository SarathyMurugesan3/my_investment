package com.example.demo.auth.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SignedUrlService {

    @Value("${securelearn.jwt.secret}")
    private String secret;

    public String generateToken(String contentId, String email, long ts) {
        try {
            String data = contentId + ":" + email + ":" + ts + ":" + secret;

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }

            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("Token generation failed");
        }
    }
    public boolean validateToken(String token, String contentId, String email, long ts) {

        long now = System.currentTimeMillis() / 1000;

        System.out.println("----- SIGNED URL DEBUG -----");
        System.out.println("Token received: " + token);
        System.out.println("ContentId: " + contentId);
        System.out.println("Email from JWT: " + email);
        System.out.println("Timestamp received: " + ts);
        System.out.println("Server time: " + now);

        String expected = generateToken(contentId, email, ts);

        System.out.println("Expected token: " + expected);

        if (Math.abs(now - ts) > 600) {
            System.out.println("FAILED: timestamp expired");
            return false;
        }

        if (!expected.equals(token)) {
            System.out.println("FAILED: token mismatch");
            return false;
        }

        System.out.println("SUCCESS: token valid");
        return true;
    }

//    public boolean validateToken(String token, String contentId, String email, long ts) {
//
//        long now = System.currentTimeMillis() / 1000;
//
//        if (Math.abs(now - ts) > 600) {
//            return false;
//        }
//
//        String expected = generateToken(contentId, email, ts);
//        return expected.equals(token);
//    }
}