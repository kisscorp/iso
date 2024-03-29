# Use an official Python runtime as a parent image
FROM python:3.7-slim

# Set the working directory in the container to /app
WORKDIR /app

# Add the current directory contents into the container at /app
ADD . /app

# Create a simple Python script that prints "Hello, World!"
RUN echo 'print("Hello, World!")' > hello.py

# Run hello.py when the container launches
CMD ["python", "hello.py"]