# syntax=docker/dockerfile:1
FROM maven:3.9-eclipse-temurin-21 AS build
ARG SERVICE
WORKDIR /build
COPY ${SERVICE}/pom.xml ./pom.xml
COPY ${SERVICE}/src/main ./src/main
RUN --mount=type=cache,target=/root/.m2 mvn -B -Dmaven.test.skip=true package
RUN cp target/*-SNAPSHOT.jar /app.jar

FROM eclipse-temurin:21-jre-jammy
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 workgo && useradd --uid 10001 --gid workgo --create-home workgo \
    && mkdir /data && chown workgo:workgo /data
WORKDIR /app
COPY --from=build /app.jar /app/app.jar
USER workgo
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65.0"
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
