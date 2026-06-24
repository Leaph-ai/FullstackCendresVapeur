# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set the working directory in the container
WORKDIR /app

# Install uv
RUN pip install uv

# Copy the dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies from lockfile, and ensure uvicorn is present for serving.
# We install uvicorn separately to ensure it's available for the CMD.
RUN uv sync --no-dev && uv pip install "uvicorn[standard]"

# Copy the rest of the application code into the container
COPY . .

# The port the app will run on
EXPOSE 8000

# Command to run the application as a Python module, which is more robust.
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
