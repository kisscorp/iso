#!/bin/sh

# Copy data from /initial-data to /app
cp -R /initial-data/. /app

bandit -r /app
python /scripts/hello.py