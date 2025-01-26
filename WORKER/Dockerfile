# # Use Alpine 3.9 as the base image
# FROM node:12-alpine3.9

# # Set the working directory inside the container
# WORKDIR /app/temp
# RUN apk add --no-cache coreutils

# FROM python:3.12-alpine

# # Set a working directory
# WORKDIR /app/temp
# RUN apk add --no-cache coreutils

# FROM alpine:3.9

# # Set the working directory
# WORKDIR /app/temp

# # Install build tools (build-base)
# RUN apk add --no-cache build-base \
#     coreutils

# FROM openjdk:8-jdk-alpine

# # Set the working directory
# WORKDIR /app/temp
# RUN apk add --no-cache coreutils

FROM golang:1.19-alpine
# FROM golang:alpine
# Set the working directory
WORKDIR /app/temp
RUN apk add --no-cache coreutils

# docker run --memory="150m" --cpus="0.5" --name worker worker:v1









