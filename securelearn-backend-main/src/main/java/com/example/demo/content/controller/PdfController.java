package com.example.demo.content.controller;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.auth.security.SignedUrlService;
import com.example.demo.content.model.Content;
import com.example.demo.content.repository.ContentRepository;
import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.watermark.PdfWatermarkService;

@RestController
@RequestMapping("/api/student/pdf")
public class PdfController {

    private final ContentRepository contentRepository;
    private final PdfWatermarkService watermarkService;
    private final UserRepository userRepository;
    private final SignedUrlService signedUrlService;

    @Autowired
    public PdfController(ContentRepository contentRepository,
                         PdfWatermarkService watermarkService,
                         UserRepository userRepository,
                         SignedUrlService signedUrlService) {

        this.contentRepository = contentRepository;
        this.watermarkService = watermarkService;
        this.userRepository = userRepository;
        this.signedUrlService = signedUrlService;
    }
    
    @GetMapping("/url/{id}")
    public ResponseEntity<String> getSignedPdfUrl(
            @PathVariable String id,
            Authentication authentication) {

        String email = authentication.getName();

        long ts = System.currentTimeMillis() / 1000;

        String token = signedUrlService.generateToken(id, email, ts);

        // Note: urlEncoding of email is handled dynamically by string formatting if needed, 
        // but typically email is safe in query params.
        String url = "https://securelearn-backend.onrender.com/api/student/pdf/"
                + id + "?token=" + token + "&ts=" + ts + "&email=" + email;

        return ResponseEntity.ok(url);
    }
    

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> viewPdf(@PathVariable String id,
                                          @RequestParam String token,
                                          @RequestParam long ts,
                                          @RequestParam String email) throws Exception {

        System.out.println("STEP 1: request received for pdf " + id);
        System.out.println("STEP 2: user email = " + email);

        if (!signedUrlService.validateToken(token, id, email, ts)) {
            System.out.println("STEP 3: token validation FAILED");
            return ResponseEntity.status(403).body("Token validation failed".getBytes());
        }

        System.out.println("STEP 4: token valid");

        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        System.out.println("STEP 5: student found");

        if (student.getAdminId() == null) {
            System.out.println("STEP 6: student has no adminId");
            return ResponseEntity.status(403).body("Student has no assigned admin".getBytes());
        }

        User admin = userRepository.findById(student.getAdminId())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        System.out.println("STEP 7: admin found = " + admin.getEmail());

        Content content = contentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Content not found"));

        System.out.println("STEP 8: content uploaded by = " + content.getUploadedBy());

        if (!admin.getEmail().equals(content.getUploadedBy())) {
            System.out.println("STEP 9: admin mismatch -> forbidden");
            return ResponseEntity.status(403).body("Content does not belong to your admin".getBytes());
        }

        System.out.println("STEP 10: permission OK");

        java.io.File pdfFile = new java.io.File(content.getFilePath());
        if (!pdfFile.exists()) {
            System.out.println("STEP 11: File missing on disk! (Probably wiped by Render)");
            return ResponseEntity.status(404).body("Error: The physical PDF file no longer exists on this server. This happens on free Render tiers because the temporary folder resets. Please re-upload the document.".getBytes());
        }

        String watermarkText = student.getEmail() + " | IP Tracked | SecureLearn";

        byte[] watermarkedPdf =
                watermarkService.addWatermark(content.getFilePath(), watermarkText);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=secure.pdf")
                .body(watermarkedPdf);
    }
}