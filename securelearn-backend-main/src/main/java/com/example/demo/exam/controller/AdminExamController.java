package com.example.demo.exam.controller;

import com.example.demo.exam.model.Exam;
import com.example.demo.exam.model.ExamAttempt;
import com.example.demo.exam.model.Question;
import com.example.demo.exam.repository.ExamAttemptRepository;
import com.example.demo.exam.repository.ExamRepository;
import com.example.demo.exam.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/exams")
public class AdminExamController {

    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final UserRepository userRepository;

    @Autowired
    public AdminExamController(ExamRepository examRepository, QuestionRepository questionRepository, ExamAttemptRepository examAttemptRepository, UserRepository userRepository) {
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
        this.examAttemptRepository = examAttemptRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<Exam> createExam(@RequestBody Exam exam, Authentication authentication) {
        String adminEmail = authentication.getName();
        User admin = userRepository.findByEmail(adminEmail).orElseThrow();
        
        if (exam.getQuestionIds() == null) {
            exam.setQuestionIds(new ArrayList<>());
        }
        exam.setAdminId(admin.getId());
        Exam savedExam = examRepository.save(exam);
        return ResponseEntity.ok(savedExam);
    }

    @PostMapping("/{examId}/questions")
    public ResponseEntity<?> addQuestionToExam(@PathVariable String examId, @RequestBody Question question, Authentication authentication) {
        String adminEmail = authentication.getName();
        User admin = userRepository.findByEmail(adminEmail).orElseThrow();
        
        Optional<Exam> examOpt = examRepository.findById(examId);
        if (examOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Exam exam = examOpt.get();
        if(!admin.getId().equals(exam.getAdminId())) return ResponseEntity.status(403).build();
        
        Question savedQuestion = questionRepository.save(question);
        
        exam.getQuestionIds().add(savedQuestion.getId());
        examRepository.save(exam);

        return ResponseEntity.ok(savedQuestion);
    }

    @GetMapping
    public ResponseEntity<List<Exam>> getAllExams(Authentication authentication) {
        String adminEmail = authentication.getName();
        User admin = userRepository.findByEmail(adminEmail).orElseThrow();
        return ResponseEntity.ok(examRepository.findByAdminId(admin.getId()));
    }

    @GetMapping("/{examId}")
    public ResponseEntity<Exam> getExam(@PathVariable String examId, Authentication authentication) {
        String adminEmail = authentication.getName();
        User admin = userRepository.findByEmail(adminEmail).orElseThrow();
        
        return examRepository.findById(examId)
                .filter(exam -> admin.getId().equals(exam.getAdminId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/{examId}/questions")
    public ResponseEntity<List<Question>> getExamQuestions(@PathVariable String examId, Authentication authentication) {
        String adminEmail = authentication.getName();
        User admin = userRepository.findByEmail(adminEmail).orElseThrow();
        
        Optional<Exam> examOpt = examRepository.findById(examId);
        if (examOpt.isEmpty() || !admin.getId().equals(examOpt.get().getAdminId())) {
            return ResponseEntity.notFound().build();
        }
        
        List<String> questionIds = examOpt.get().getQuestionIds();
        List<Question> questions = (List<Question>) questionRepository.findAllById(questionIds);
        return ResponseEntity.ok(questions);
    }

    @GetMapping("/{examId}/attempts")
    public ResponseEntity<List<ExamAttempt>> getExamAttempts(@PathVariable String examId, Authentication authentication) {
        String adminEmail = authentication.getName();
        User admin = userRepository.findByEmail(adminEmail).orElseThrow();
        
        Optional<Exam> examOpt = examRepository.findById(examId);
        if (examOpt.isEmpty() || !admin.getId().equals(examOpt.get().getAdminId())) {
            return ResponseEntity.notFound().build();
        }
        
        List<ExamAttempt> attempts = examAttemptRepository.findByExamId(examId);
        return ResponseEntity.ok(attempts);
    }
}
