package com.example.demo.exam.repository;

import com.example.demo.exam.model.ExamAttempt;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamAttemptRepository extends MongoRepository<ExamAttempt, String> {
    List<ExamAttempt> findByExamId(String examId);
    List<ExamAttempt> findByUserId(String userId);
    Optional<ExamAttempt> findByUserIdAndExamId(String userId, String examId);
}
