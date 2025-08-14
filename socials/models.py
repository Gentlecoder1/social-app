from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
import uuid
import os
from datetime import datetime

# Profile model linked to Django User
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    works_at = models.CharField(max_length=100, blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True) 
    profilepic = models.ImageField(upload_to='profile_pics/', default='blank-profile-picture.png')
    cover_photo = models.ImageField(upload_to='cover_photos/', blank=True, null=True)
    location = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return str(self.user.id)


def validate_media_file(value):
    """Validate that the uploaded file is an image or video"""
    valid_image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    valid_video_extensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv']
    
    ext = os.path.splitext(value.name)[1].lower()
    if ext not in valid_image_extensions + valid_video_extensions:
        raise ValidationError('Only image and video files are allowed.')

class Post(models.Model):
    MEDIA_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    caption = models.TextField()
    media = models.FileField(upload_to='post_media/', validators=[validate_media_file], null=True, blank=True)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE_CHOICES, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    no_of_likes = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        """Automatically determine media type based on file extension"""
        if self.media:
            ext = os.path.splitext(self.media.name)[1].lower()
            image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
            video_extensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv']
            
            if ext in image_extensions:
                self.media_type = 'image'
            elif ext in video_extensions:
                self.media_type = 'video'
        
        super().save(*args, **kwargs)

    def __str__(self):
        return str(self.user.id)

class LikePost(models.Model):
    post_id = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    username = models.ForeignKey(User, on_delete=models.CASCADE, related_name='liked_by')

    def __str__(self):
        return self.username

class Comment(models.Model):
    post_id = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    username = models.ForeignKey(User, on_delete=models.CASCADE, related_name='commented_by')
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} on {self.post_id}"

class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"