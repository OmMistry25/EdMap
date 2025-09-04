#!/bin/bash

# Start the Gradescope API Server
echo "Starting Gradescope API Server..."

# Activate virtual environment
source ../gradescope-api-env/bin/activate

# Set port (can be overridden with GRADESCOPE_API_PORT env var)
export GRADESCOPE_API_PORT=${GRADESCOPE_API_PORT:-8001}

# Start the server
python gradescope-server.py
