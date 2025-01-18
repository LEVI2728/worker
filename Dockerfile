# # Use Alpine 3.9 as the base image
# FROM node:12-alpine3.9

# # Set the working directory inside the container
# WORKDIR /app/temp

# FROM python:3.12-alpine

# # Set a working directory
# WORKDIR /app/temp

# FROM alpine:3.9

# # Set the working directory
# WORKDIR /app/temp

# # Install build tools (build-base)
# RUN apk add --no-cache build-base


# FROM openjdk:8-jdk-alpine

# # Set the working directory
# WORKDIR /app/temp

# FROM golang:1.19-alpine
# FROM golang:alpine
# # Set the working directory
# WORKDIR /app/temp

# # Stage 1: Build stage
# FROM node:18-alpine AS build

# # Set the working directory
# WORKDIR /usr/src/app

# # Copy package files and install dependencies
# COPY ./package*.json ./
# RUN npm install && npm cache clean --force 

# # Install necessary build tools and runtimes (used only for building)
# RUN apk update && apk add --no-cache \
#     python3 \
#     openjdk8 \
#     go \
#     build-base \
#     g++ \
#     make

# # Copy application source code
# COPY . .

# # Stage 2: Final runtime stage
# FROM node:18-alpine

# # Set the working directory
# WORKDIR /usr/src/app

# # Install necessary runtimes for code execution (Python, Java, Go, C++, node)
# RUN apk update && apk add --no-cache \
#     python3 \
#     openjdk8 \
#     go \
#     g++ \
#     make && \
#     mkdir -p /sandbox && chmod 700 /sandbox

# # Copy only the necessary files from the build stage (no unnecessary build tools)
# COPY --from=build /usr/src/app /usr/src/app

# # Command to start the application
# CMD ["npm", "start"]

# docker run --memory="150m" --cpus="0.5" --name worker worker:v1

# Stage 1: Build stage
FROM node:18-alpine AS build

# Set the working directory
WORKDIR /usr/src/app

# Install necessary build tools
RUN apk update && apk add --no-cache \
    python3 \
    openjdk11 \
    go \
    build-base \
    g++ \
    make

# Copy package files and install dependencies
COPY ./package*.json ./
RUN npm install && npm cache clean --force

# Copy application source code
COPY . .

# Stage 2: Final runtime stage
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

#Install nodemon for hot reloading
RUN npm install nodemon -g

# Install runtime dependencies
RUN apk update && apk add --no-cache \
    python3 \
    openjdk11 \
    go \
    g++ \
    make && \
    mkdir -p /sandbox

# Copy necessary files from the build stage
COPY --from=build /usr/src/app /usr/src/app

# Command to start the application
CMD ["npm", "start"]










