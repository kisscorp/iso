#!/bin/sh

# Copy data from /initial-data to /app
cp -R /initial-data/. /app

radon cc /app
radon mi /app
radon hal /app
radon raw /app
# radon cc /app/hello.py
# radon cc /app -nc
python /scripts/hello.py
# python /app/hello.py