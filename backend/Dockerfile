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

# Put the project virtualenv on PATH so the venv's interpreter (with uvicorn
# and all deps) is used instead of the global /usr/local/bin/python.
ENV PATH="/app/.venv/bin:$PATH"

# Copy the rest of the application code into the container
COPY . .

# The port the app will run on
EXPOSE 8000

# Run uvicorn from the venv (now first on PATH).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
