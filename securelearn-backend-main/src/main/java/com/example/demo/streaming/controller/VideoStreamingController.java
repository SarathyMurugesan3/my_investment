package com.example.demo.streaming.controller;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.demo.content.model.Content;
import com.example.demo.content.repository.ContentRepository;
import com.example.demo.streaming.service.VideoTokenService;
import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/student/video")
@CrossOrigin(origins = "*")
public class VideoStreamingController {

    private final ContentRepository contentRepository;
    private final VideoTokenService videoTokenService;
    private final UserRepository userRepository;

    @Autowired
    public VideoStreamingController(ContentRepository contentRepository,
                                    VideoTokenService videoTokenService,
                                    UserRepository userRepository) {
        this.contentRepository = contentRepository;
        this.videoTokenService = videoTokenService;
        this.userRepository = userRepository;
    }

    /**
     * Generate short-lived video token (for HLS file-based streaming)
     */
    @GetMapping("/token/{id}")
    public ResponseEntity<String> generateToken(
            @PathVariable String id,
            @RequestHeader("X-Device-Fingerprint") String fingerprint,
            Authentication authentication,
            HttpServletRequest request) {

        String email = authentication.getName();
        String ip = request.getRemoteAddr();

        String token = videoTokenService.generateVideoToken(id, email, fingerprint, ip);
        return ResponseEntity.ok(token);
    }

    /**
     * Secure Video URL (Mighty Networks style)
     *
     * Returns the videoUrl for VIDEO_URL type content.
     * Access is gated behind JWT — the URL is never exposed publicly.
     * The student must belong to the admin who uploaded the content.
     *
     * GET /api/student/video/{id}/secure-url
     */
    @GetMapping("/{id}/secure-url")
    public ResponseEntity<?> getSecureVideoUrl(
            @PathVariable String id,
            Authentication authentication) {

        String studentEmail = authentication.getName();

        // Load student to get their adminId
        User student = userRepository.findByEmail(studentEmail)
                .orElse(null);
        if (student == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Student not found");
        }

        // Load content
        Content content = contentRepository.findById(id).orElse(null);
        if (content == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Content not found");
        }

        // Verify content belongs to the student's admin (access control)
        User admin = userRepository.findById(student.getAdminId() != null ? student.getAdminId() : "").orElse(null);
        if (admin == null || !content.getUploadedBy().equals(admin.getEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }

        // Must be a VIDEO_URL type
        if (!"VIDEO_URL".equals(content.getType())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("This content is not a video link. Use the HLS stream endpoint.");
        }

        return ResponseEntity.ok(content.getVideoUrl());
    }

    /**
     * Secure HLS Segment (.ts files)
     */
    @GetMapping("/{id}/segment/{file}")
    public ResponseEntity<Resource> streamSegment(
            @PathVariable String id,
            @PathVariable String file,
            @RequestParam String token,
            @RequestHeader("X-Device-Fingerprint") String fingerprint,
            HttpServletRequest request) throws MalformedURLException {

        String ip = request.getRemoteAddr();

        if (!videoTokenService.validateToken(token, id, fingerprint, ip)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Content content = contentRepository.findById(id).orElseThrow();
        Path path = Paths.get(content.getFilePath(), file);
        Resource resource = new UrlResource(path.toUri());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("video/mp2t"))
                .body(resource);
    }

    /**
     * Secure HLS Playlist
     */
    @GetMapping("/{id}/playlist")
    public ResponseEntity<String> streamPlaylist(
            @PathVariable String id,
            @RequestParam String token,
            @RequestHeader("X-Device-Fingerprint") String fingerprint,
            HttpServletRequest request)
            throws IOException {

        String ip = request.getRemoteAddr();

        if (!videoTokenService.validateToken(token, id, fingerprint, ip)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Content content = contentRepository.findById(id).orElseThrow();
        Path playlistPath = Paths.get(content.getFilePath(), "playlist.m3u8");
        List<String> lines = Files.readAllLines(playlistPath);
        List<String> modified = new ArrayList<>();

        for (String line : lines) {
            if (line.endsWith(".ts")) {
                String newLine =
                        "/api/student/video/" + id +
                        "/segment/" + line +
                        "?token=" + token;
                modified.add(newLine);
            } else {
                modified.add(line);
            }
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.apple.mpegurl"))
                .body(String.join("\n", modified));
    }
}