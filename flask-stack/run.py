#!/usr/bin/env python
"""
Development server runner
Quick start script for testing the reactive Flask app
"""

import os
from app import create_app

# Set environment variables
os.environ.setdefault('FLASK_ENV', 'development')
os.environ.setdefault('FLASK_DEBUG', '1')

# Create app
app = create_app()

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Flask Reactive App Starting...")
    print("=" * 60)
    print("📱 Open: http://localhost:5000")
    print("🔐 Login: /auth/login")
    print("📝 Features:")
    print("   - Dialog-based compose (no page navigation)")
    print("   - In-place replies")
    print("   - Form POST + redirect pattern")
    print("   - CSS animations for reactive feel")
    print("   - Only 4 one-line JS statements!")
    print("=" * 60)
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        use_reloader=True
    )
