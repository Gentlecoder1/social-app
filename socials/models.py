from django.db import models
from django.contrib.auth.models import User
import uuid
from datetime import datetime

# Profile model linked to Django User
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True) 
    profilepic = models.ImageField(upload_to='profile_pics/', default='blank-profile-picture.png')
    location = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return str(self.user.id)

class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    caption = models.TextField()
    image = models.ImageField(upload_to='post_images/')
    created_at = models.DateTimeField(auto_now_add=True)
    no_of_likes = models.IntegerField(default=0)
    no_of_comments = models.IntegerField(default=0)

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
    created_at = models.DateTimeField(default=datetime.now)

    def __str__(self):
        return f"{self.username} on {self.post_id}"

class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"