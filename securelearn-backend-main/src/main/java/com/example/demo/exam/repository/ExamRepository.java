package com.example.demo.exam.repository;

import com.example.demo.exam.model.Exam;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamRepository extends MongoRepository<Exam, String> {
    java.util.List<Exam> findByAdminId(String adminId);
}
