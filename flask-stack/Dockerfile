# Flask Stack Dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# uv for fast dependency installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install the package (dependencies + app code)
COPY pyproject.toml ./
COPY app/ ./app/
RUN uv pip install --system --no-cache .

# Run as an unprivileged user
RUN useradd --create-home appuser
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1

# gthread workers so the SSE notification stream doesn't block a whole worker
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--worker-class", "gthread", "--threads", "8", "app:create_app()"]
