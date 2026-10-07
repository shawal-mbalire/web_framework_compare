#!/usr/bin/env python
"""
Development server runner: python run.py  (or: flask --app app run --debug)
"""

from app import create_app

app = create_app()

if __name__ == "__main__":
    print("Flask stack running on http://localhost:5000  (login: /auth/login)")
    app.run(host="0.0.0.0", port=5000, debug=True)
