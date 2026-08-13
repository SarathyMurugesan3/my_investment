package com.example.demo.exam.controller;

import com.example.demo.exam.model.Exam;
import com.example.demo.exam.model.ExamAttempt;
import com.example.demo.exam.model.Question;
import com.example.demo.exam.repository.ExamAttemptRepository;
import com.example.demo.exam.repository.ExamRepository;
import com.example.demo.exam.repository.QuestionRepository;
import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/student/exams")
public class StudentExamController {

    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final UserRepository userRepository;

    @Autowired
    public StudentExamController(ExamRepository examRepository, QuestionRepository questionRepository, ExamAttemptRepository examAttemptRepository, UserRepository userRepository) {
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
        this.examAttemptRepository = examAttemptRepository;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public ResponseEntity<List<Exam>> getAvailableExams(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user.getAdminId() == null) return ResponseEntity.ok(java.util.Collections.emptyList());
        return ResponseEntity.ok(examRepository.findByAdminId(user.getAdminId()));
    }

    @PostMapping("/{examId}/start")
    public ResponseEntity<?> startExam(@PathVariable String examId, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        
        // Check if exam exists and belongs to the student's admin
        Optional<Exam> examOpt = examRepository.findById(examId);
        if (examOpt.isEmpty()) return ResponseEntity.notFound().build();
        if (user.getAdminId() == null || !user.getAdminId().equals(examOpt.get().getAdminId())) {
            return ResponseEntity.notFound().build();
        }

        // Check if an attempt already exists and is IN_PROGRESS
        Optional<ExamAttempt> existingAttempt = examAttemptRepository.findByUserIdAndExamId(user.getId(), examId);
        if (existingAttempt.isPresent() && !existingAttempt.get().getStatus().equals("SUBMITTED")) {
            return ResponseEntity.badRequest().body("An attempt is already in progress for this exam.");
        }

        // Create a new attempt
        ExamAttempt attempt = new ExamAttempt();
        attempt.setUserId(user.getId());
        attempt.setExamId(examId);
        attempt.setAnswers(new HashMap<>());
        
        ExamAttempt savedAttempt = examAttemptRepository.save(attempt);
        return ResponseEntity.ok(savedAttempt);
    }
    
    @GetMapping("/{examId}/questions")
    public ResponseEntity<?> getExamQuestions(@PathVariable String examId, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        
        // Verify attempt exists and is IN_PROGRESS
        Optional<ExamAttempt> attemptOpt = examAttemptRepository.findByUserIdAndExamId(user.getId(), examId);
        if (attemptOpt.isEmpty() || !attemptOpt.get().getStatus().equals("IN_PROGRESS")) {
            return ResponseEntity.badRequest().body("No active attempt found for this exam. Please start the exam first.");
        }
        
        Optional<Exam> examOpt = examRepository.findById(examId);
        if (examOpt.isEmpty()) return ResponseEntity.notFound().build();
        if (user.getAdminId() == null || !user.getAdminId().equals(examOpt.get().getAdminId())) {
             return ResponseEntity.notFound().build();
        }
        
        List<String> questionIds = examOpt.get().getQuestionIds();
        List<Question> questions = (List<Question>) questionRepository.findAllById(questionIds);
        
        // Mask the correct answers before sending to student
        for(Question q : questions) {
            q.setCorrectAnswer(null);
        }
        
        return ResponseEntity.ok(questions);
    }

    @PostMapping("/attempts/{attemptId}/log-violation")
    public ResponseEntity<?> logViolation(@PathVariable String attemptId, @RequestParam String type, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        
        Optional<ExamAttempt> attemptOpt = examAttemptRepository.findById(attemptId);
        if (attemptOpt.isEmpty() || !attemptOpt.get().getUserId().equals(user.getId())) {
            return ResponseEntity.notFound().build();
        }

        ExamAttempt attempt = attemptOpt.get();
        if ("SUBMITTED".equals(attempt.getStatus())) {
             return ResponseEntity.badRequest().body("Exam already submitted.");
        }

        if ("TAB_SWITCH".equalsIgnoreCase(type)) {
            attempt.incrementTabSwitches();
        } else if ("FULLSCREEN_EXIT".equalsIgnoreCase(type)) {
            attempt.incrementFullscreenExits();
        } else {
             return ResponseEntity.badRequest().body("Invalid violation type.");
        }
        
        // Automatically flag if risk score is too high (e.g., > 50)
        if (attempt.getRiskScore() >= 50 && attempt.getStatus().equals("IN_PROGRESS")) {
             attempt.setStatus("FLAGGED");
        }

        examAttemptRepository.save(attempt);
        return ResponseEntity.ok(Map.of("message", "Violation logged successfully", "currentRiskScore", attempt.getRiskScore()));
    }

    @PostMapping("/attempts/{attemptId}/submit")
    public ResponseEntity<?> submitExam(@PathVariable String attemptId, @RequestBody Map<String, String> answers, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        
        Optional<ExamAttempt> attemptOpt = examAttemptRepository.findById(attemptId);
        if (attemptOpt.isEmpty() || !attemptOpt.get().getUserId().equals(user.getId())) {
            return ResponseEntity.notFound().build();
        }

        ExamAttempt attempt = attemptOpt.get();
        if ("SUBMITTED".equals(attempt.getStatus())) {
            return ResponseEntity.badRequest().body("Exam already submitted.");
        }

        // Calculate score
        int score = 0;
        Optional<Exam> examOpt = examRepository.findById(attempt.getExamId());
        if (examOpt.isPresent()) {
            List<String> questionIds = examOpt.get().getQuestionIds();
            List<Question> questions = (List<Question>) questionRepository.findAllById(questionIds);

            for (Question q : questions) {
                String studentAnswer = answers.get(q.getId());
                if (studentAnswer != null && studentAnswer.equals(q.getCorrectAnswer())) {
                    score++;
                }
            }
        }

        attempt.setAnswers(answers);
        attempt.setScore(score);
        attempt.setEndTime(LocalDateTime.now());
        if(attempt.getStatus().equals("IN_PROGRESS")) {
        	attempt.setStatus("SUBMITTED");
        } // Preserve FLAGGED status if it was set during a violation
        
        examAttemptRepository.save(attempt);

        return ResponseEntity.ok(attempt);
    }
}
