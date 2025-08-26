#!/usr/bin/env python
"""
Django Data Migration Script: SQLite to Supabase
This script helps migrate data from SQLite to Supabase PostgreSQL database.
"""

import os
import django
import json
from pathlib import Path

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'socialapp.settings')
django.setup()

from django.core.management import execute_from_command_line
from django.contrib.auth.models import User
from socials.models import Profile, Post, Comment, Follow, LikePost, Notification

def check_sqlite_data():
    """Check what data exists in SQLite database"""
    print("=== SQLite Database Data Summary ===")
    print(f"Users: {User.objects.count()}")
    print(f"Profiles: {Profile.objects.count()}")
    print(f"Posts: {Post.objects.count()}")
    print(f"Comments: {Comment.objects.count()}")
    print(f"Follows: {Follow.objects.count()}")
    print(f"Likes: {LikePost.objects.count()}")
    print(f"Notifications: {Notification.objects.count()}")
    print("="*40)

def backup_sqlite_data():
    """Create a backup of SQLite data"""
    print("Creating backup of SQLite data...")
    try:
        # Create backup using Django's dumpdata
        execute_from_command_line([
            'manage.py', 'dumpdata', 
            '--natural-foreign', '--natural-primary',
            '-e', 'contenttypes', '-e', 'auth.Permission',
            '--indent', '4', '--output', 'sqlite_backup.json'
        ])
        print("✅ SQLite backup created successfully: sqlite_backup.json")
        return True
    except Exception as e:
        print(f"❌ Error creating backup: {e}")
        return False

def restore_to_supabase():
    """Restore data to Supabase database"""
    print("Restoring data to Supabase...")
    try:
        # Load data into Supabase
        execute_from_command_line([
            'manage.py', 'loaddata', 'sqlite_backup.json'
        ])
        print("✅ Data restored to Supabase successfully!")
        return True
    except Exception as e:
        print(f"❌ Error restoring to Supabase: {e}")
        return False

if __name__ == "__main__":
    print("Django Data Migration: SQLite → Supabase")
    print("="*50)
    
    # Step 1: Check SQLite data
    check_sqlite_data()
    
    # Step 2: Create backup
    if input("Create backup from SQLite? (y/n): ").lower() == 'y':
        backup_sqlite_data()
        
        # Step 3: Switch to Supabase and restore
        print("\n⚠️  IMPORTANT: Now switch your settings.py to use Supabase database")
        print("Then run: python manage.py migrate")
        print("Then run: python manage.py loaddata sqlite_backup.json")
