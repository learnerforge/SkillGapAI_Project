import streamlit as st
import hashlib
import sqlite3
from datetime import datetime
import os

DB_PATH = 'data/users.db'

def init_auth_db():
    """Initialize authentication database"""
    os.makedirs('data', exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
    )''')
    conn.commit()
    conn.close()

def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def register_user(username, password, email):
    """Register a new user"""
    try:
        init_auth_db()
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        hashed_pw = hash_password(password)
        c.execute('INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
                 (username, hashed_pw, email))
        conn.commit()
        conn.close()
        return True, " Registration successful! Please log in."
    except sqlite3.IntegrityError:
        return False, " Username already exists. Please choose a different one."
    except Exception as e:
        return False, f" Error: {str(e)}"

def authenticate_user(username, password):
    """Authenticate user credentials"""
    try:
        init_auth_db()
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        hashed_pw = hash_password(password)
        c.execute('SELECT id, username FROM users WHERE username = ? AND password = ?',
                 (username, hashed_pw))
        user = c.fetchone()
        
        if user:
            # Update last login time
            c.execute('UPDATE users SET last_login = ? WHERE id = ?',
                     (datetime.now(), user[0]))
            conn.commit()
            conn.close()
            return True, user
        else:
            conn.close()
            return False, None
    except Exception as e:
        return False, None

def get_user_info(username):
    """Get user information"""
    try:
        init_auth_db()
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT id, username, email, created_at, last_login FROM users WHERE username = ?',
                 (username,))
        user = c.fetchone()
        conn.close()
        return user
    except Exception as e:
        return None
