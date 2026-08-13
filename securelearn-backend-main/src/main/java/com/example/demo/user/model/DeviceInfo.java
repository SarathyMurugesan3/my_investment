package com.example.demo.user.model;

import java.time.LocalDateTime;

public class DeviceInfo {

    private String fingerprint;
    private String ipAddress;
    private LocalDateTime lastLogin;

    // ✅ REQUIRED by MongoDB
    public DeviceInfo() {
    }

    public DeviceInfo(String fingerprint, String ipAddress) {
        this.fingerprint = fingerprint;
        this.ipAddress = ipAddress;
        this.lastLogin = LocalDateTime.now();
    }

    public void updateLoginTime() {
        this.lastLogin = LocalDateTime.now();
    }

    // getters & setters
    public String getFingerprint() {
        return fingerprint;
    }

    public void setFingerprint(String fingerprint) {
        this.fingerprint = fingerprint;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public LocalDateTime getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(LocalDateTime lastLogin) {
        this.lastLogin = lastLogin;
    }
}