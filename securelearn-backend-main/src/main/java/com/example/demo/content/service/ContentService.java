package com.example.demo.content.service;

import com.example.demo.content.dto.ContentResponse;
import com.example.demo.content.model.Content;
import com.example.demo.content.repository.ContentRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContentService {

    private final ContentRepository contentRepository;

    public ContentService(ContentRepository contentRepository) {
        this.contentRepository = contentRepository;
    }

    public List<ContentResponse> listAllContent(String adminEmail) {
        List<Content> contents = contentRepository.findAllByUploadedBy(adminEmail);

        return contents.stream()
                .map(content -> new ContentResponse(
                        content.getId(),
                        content.getTitle(),
                        content.getDescription(),
                        content.getType(),
                        content.getFileName(),
                        content.getVideoUrl(),
                        content.getUploadedAt()
                ))
                .collect(Collectors.toList());
    }
}