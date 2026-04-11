"""
Arcgentic Agent Service — Flask API entrypoint.

Endpoints are registered via blueprints in the ``routes/`` package.
Run directly with ``python app.py`` or via ``pnpm dev``.
"""

from config import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
