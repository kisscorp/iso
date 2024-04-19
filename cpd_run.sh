#!/bin/sh

# Remove any existing data in /app
rm -rf /app/*

# Copy data from /initial-data to /app
cp -R /initial-data/. /app

# Run PMD CPD on /app directory
pmd cpd --minimum-tokens 5 --language python --files /app

# Navigate to the scripts directory
cd /scripts

# Compile the HelloWorld.java file
javac HelloWorld.java

# If compilation is successful, run the HelloWorld class
if [ $? -eq 0 ]; then
    java HelloWorld
else
    echo "Compilation failed."
    exit 1
fi