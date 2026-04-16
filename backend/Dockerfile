FROM python:3.12-slim

WORKDIR /app

# Install system dependencies required for Prophet to compile
RUN apt-get update && apt-get install -y build-essential curl

# Copy all backend files into the container
COPY . /app

# Install core dependencies AND the missing Machine Learning packages (CPU-only to save space)
RUN pip install --no-cache-dir .
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir transformers accelerate huggingface_hub

# Pre-download the LLM model weights into the container so it doesn't fail on startup
RUN python download_model.py

# Cloud Run expects the app to listen on port 8080
EXPOSE 8080

# Start the FastAPI server
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]