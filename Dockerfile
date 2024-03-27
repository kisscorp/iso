# Use an official Python runtime as a parent image
FROM python:3.7-slim

# Set the working directory in the container to /app
WORKDIR /app

# Add the current directory contents into the container at /app
ADD . /app

# Create a simple Python script that prints "Hello, World!", "Application completed successfully", and then waits for 10 seconds
RUN echo 'import time\nprint("Hello, World!")\nprint("Application completed successfully")\ntime.sleep(10)' > hello.py

# Run hello.py when the container launches
CMD ["python", "hello.py"]