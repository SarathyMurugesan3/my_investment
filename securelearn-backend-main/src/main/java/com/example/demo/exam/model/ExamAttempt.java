package com.example.demo.exam.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "exam_attempts")
public class ExamAttempt {
    @Id
    private String id;
    private String userId;
    private String examId;
    private int score;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    
    // Map of Question ID to Student's Selected Option
    private Map<String, String> answers;
    
    // Security tracking
    private int tabSwitches;
    private int fullscreenExits;
    private int riskScore;
    
    private String status; // e.g., "IN_PROGRESS", "SUBMITTED", "FLAGGED"

    public ExamAttempt() {
        this.tabSwitches = 0;
        this.fullscreenExits = 0;
        this.riskScore = 0;
        this.status = "IN_PROGRESS";
        this.startTime = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getExamId() {
        return examId;
    }

    public void setExamId(String examId) {
        this.examId = examId;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public Map<String, String> getAnswers() {
        return answers;
    }

    public void setAnswers(Map<String, String> answers) {
        this.answers = answers;
    }

    public int getTabSwitches() {
        return tabSwitches;
    }

    public void setTabSwitches(int tabSwitches) {
        this.tabSwitches = tabSwitches;
    }

    public void incrementTabSwitches() {
        this.tabSwitches++;
        this.riskScore += 10; // increase risk by 10 for each tab switch
    }

    public int getFullscreenExits() {
        return fullscreenExits;
    }

    public void setFullscreenExits(int fullscreenExits) {
        this.fullscreenExits = fullscreenExits;
    }

    public void incrementFullscreenExits() {
        this.fullscreenExits++;
        this.riskScore += 15; // increase risk by 15 for exiting fullscreen
    }

    public int getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(int riskScore) {
        this.riskScore = riskScore;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
