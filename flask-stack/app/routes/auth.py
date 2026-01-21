"""
Authentication routes
Session-based authentication
"""

from flask import Blueprint, request, render_template, redirect, url_for, flash, session

bp = Blueprint("auth", __name__)


@bp.route("/register", methods=["GET", "POST"])
def register():
    """Register a new user"""
    if request.method == "GET":
        return render_template("pages/auth/register.html")
    
    # POST - handle registration
    username = request.form.get("username", "").strip()
    email = request.form.get("email", "").strip()
    password = request.form.get("password", "")
    password_confirm = request.form.get("password_confirm", "")
    
    # TODO: Implement user registration
    # 1. Validate input
    # 2. Check if username/email exists
    # 3. Hash password with bcrypt
    # 4. Create user in database
    # 5. Create session
    
    if not username or not email or not password:
        flash("All fields are required", "error")
        return redirect(url_for("auth.register"))
    
    if password != password_confirm:
        flash("Passwords do not match", "error")
        return redirect(url_for("auth.register"))
    
    flash("Registration successful! Please log in.", "success")
    return redirect(url_for("auth.login"))


@bp.route("/login", methods=["GET", "POST"])
def login():
    """Login user"""
    if request.method == "GET":
        return render_template("pages/auth/login.html")
    
    # POST - handle login
    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")
    
    # TODO: Implement login
    # 1. Validate credentials
    # 2. Verify password with bcrypt
    # 3. Create session
    
    if not username or not password:
        flash("Username and password are required", "error")
        return redirect(url_for("auth.login"))
    
    # Temporary: set session
    session["user_id"] = "temp_user_id"
    session["username"] = username
    
    flash("Login successful!", "success")
    return redirect(url_for("feed.home"))


@bp.route("/logout", methods=["POST"])
def logout():
    """Logout user"""
    # TODO: Implement logout
    # 1. Clear session
    
    session.clear()
    flash("Logged out successfully", "success")
    return redirect(url_for("auth.login"))
