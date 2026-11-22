# ---------- Build stage ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY maven-settings.xml pom.xml ./
RUN mvn -B -s maven-settings.xml dependency:go-offline
COPY src ./src
RUN mvn -B -s maven-settings.xml clean package -DskipTests

# ---------- Run stage ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# Tuned for small (512 MB) free-tier instances; override via JAVA_TOOL_OPTIONS
ENV JAVA_TOOL_OPTIONS="-Xmx350m -Xss512k -XX:+UseSerialGC -XX:TieredStopAtLevel=1"
ENTRYPOINT ["java", "-jar", "app.jar"]
