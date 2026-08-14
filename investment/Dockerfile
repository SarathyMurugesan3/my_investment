# ─────────────────────────────────────────────────────────────────
# Stage 1: Build the React frontend
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

# Install dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY frontend/ ./
RUN npm run build

# ─────────────────────────────────────────────────────────────────
# Stage 2: Build the Spring Boot backend
# ─────────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /app

# Copy pom.xml and source
COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src

# Copy the React build output into Spring Boot's static resources
# Spring Boot automatically serves files from src/main/resources/static/
COPY --from=frontend-build /app/frontend/dist backend/src/main/resources/static/

# Package the application (skipping tests for faster builds)
RUN mvn -f backend/pom.xml clean package -DskipTests

# ─────────────────────────────────────────────────────────────────
# Stage 3: Minimal runtime image
# ─────────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the fat JAR (contains both backend + frontend static files)
COPY --from=backend-build /app/backend/target/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
