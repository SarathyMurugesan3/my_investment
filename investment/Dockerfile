# Stage 1: Build the backend application
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml and source code for compilation
COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src

# Package the application jar
RUN mvn -f backend/pom.xml clean package -DskipTests

# Stage 2: Runtime environment
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built jar from stage 1
COPY --from=build /app/backend/target/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
