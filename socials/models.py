from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
import uuid
import os
from cloudinary.models import CloudinaryField
from datetime import datetime

# Profile model linked to Django User
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    works_at = models.CharField(max_length=100, blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True) 
    profilepic = CloudinaryField('profilepic', folder='profile_pics', default='https://res.cloudinary.com/dou9magab/image/upload/v1756479692/user2_pd3xii.jpg')
    cover_photo = CloudinaryField('cover_photo', folder='cover_photos', blank=True, null=True)
    location = models.CharField(max_length=100, blank=True)
    saved_posts = models.ManyToManyField('Post', blank=True, related_name='saved_by')

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
    media = CloudinaryField('media', folder='post_media', validators=[validate_media_file], null=True, blank=True)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE_CHOICES, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)  # Add index for ordering
    no_of_likes = models.IntegerField(default=0)

    class Meta:
        ordering = ['-created_at']  # Default ordering
        indexes = [
            models.Index(fields=['-created_at']),  # Index for timestamp ordering
            models.Index(fields=['user']),  # Index for user queries
            models.Index(fields=['user', '-created_at']),  # Composite index
        ]

    def save(self, *args, **kwargs):
        """Automatically determine media type based on file extension"""
        if self.media:
            # Try to get file extension robustly
            ext = None
            if hasattr(self.media, 'name') and self.media.name:
                ext = os.path.splitext(self.media.name)[1].lower()
            elif hasattr(self.media, 'url') and self.media.url:
                ext = os.path.splitext(self.media.url)[1].lower()
            elif hasattr(self.media, 'public_id') and self.media.public_id:
                ext = os.path.splitext(str(self.media.public_id))[1].lower()
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

    class Meta:
        unique_together = ('post_id', 'username')  # Prevent duplicate likes
        indexes = [
            models.Index(fields=['post_id']),
            models.Index(fields=['username']),
            models.Index(fields=['post_id', 'username']),
        ]

    def __str__(self):
        return self.username

class Comment(models.Model):
    post_id = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    username = models.ForeignKey(User, on_delete=models.CASCADE, related_name='commented_by')
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['created_at']  # Default ordering for comments
        indexes = [
            models.Index(fields=['post_id']),
            models.Index(fields=['post_id', 'created_at']),
            models.Index(fields=['username']),
        ]

    def __str__(self):
        return f"{self.username} on {self.post_id}"

class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')

    class Meta:
        unique_together = ('follower', 'following')  # Prevent duplicate follows
        indexes = [
            models.Index(fields=['follower']),
            models.Index(fields=['following']),
            models.Index(fields=['follower', 'following']),
        ]

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"


# Signal to automatically create profile when user is created
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Automatically create a Profile when a new User is created"""
    if created:
        Profile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the profile when user is saved"""
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        # Create profile if it doesn't exist
        Profile.objects.get_or_create(user=instance)

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('like', 'Like'),
        ('unlike', 'Unlike'),
        ('comment', 'Comment'),
        ('follow', 'Follow'),
        ('unfollow', 'Unfollow'),
        ('post', 'New Post'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True)
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        # Prevent duplicate notifications for the same action
        unique_together = ['recipient', 'sender', 'notification_type', 'post']
    
    def __str__(self):
        return f"{self.sender.username} -> {self.recipient.username}: {self.notification_type}"