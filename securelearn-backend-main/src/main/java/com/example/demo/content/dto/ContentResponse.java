package com.example.demo.content.dto;

import java.time.LocalDateTime;

public class ContentResponse {

    private String id;
    private String title;
    private String description;
    private String type;
    private String fileName;
    private String videoUrl;    // populated for VIDEO_URL type; null for file-based content
    private LocalDateTime uploadedAt;

    public ContentResponse() {}

    public ContentResponse(String id, String title, String description,
                           String type, String fileName, String videoUrl,
                           LocalDateTime uploadedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.type = type;
        this.fileName = fileName;
        this.videoUrl = videoUrl;
        this.uploadedAt = uploadedAt;
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getType() { return type; }
    public String getFileName() { return fileName; }
    public String getVideoUrl() { return videoUrl; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
}