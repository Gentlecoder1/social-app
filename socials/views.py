from itertools import chain
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout as auth_logout
from django.contrib.auth.models import User
from .models import Profile, Post, LikePost, Comment, Follow, Notification
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
import random
from .utils import logger
from .utils import upload_to_supabase, cleanup_temp_file, generate_unique_filename, get_bucket_folder

def get_shared_context(user):
    """Get shared context data for suggestions and notifications."""
    # Get suggested users (optimized version)
    followed_users = Follow.objects.filter(follower=user).values_list('following', flat=True)
    suggestions = User.objects.select_related('profile').exclude(
        id=user.id
    ).exclude(id__in=followed_users)[:5]

    # Get recent notifications for the sidebar
    notifications = Notification.objects.filter(
        recipient=user
    ).select_related('sender', 'sender__profile', 'post').order_by('-created_at')[:10]

    return {
        "suggestions": suggestions,
        "notifications": notifications
    }

# Notification Helper Functions
def create_notification(recipient, sender, notification_type, post=None, comment=None):
    """Create a notification with automatic duplicate prevention."""
    if recipient == sender:
        return  # Don't notify users about their own actions
    
    # Remove existing notification of the same type for the same post (if applicable)
    if post:
        Notification.objects.filter(
            recipient=recipient,
            sender=sender,
            notification_type=notification_type,
            post=post
        ).delete()
    
    # Create new notification
    Notification.objects.create(
        recipient=recipient,
        sender=sender,
        notification_type=notification_type,
        post=post,
        comment=comment
    )

def create_post_notification(post):
    """Create notification when a new post is created - notify followers."""
    # Get all followers of the post author
    followers = Follow.objects.filter(following=post.user).select_related('follower')
    
    # Create notifications for each follower
    for follow_relationship in followers:
        create_notification(
            recipient=follow_relationship.follower,  # The follower gets notified
            sender=post.user,                       # The post author is the sender
            notification_type='post',
            post=post
        )

def create_like_notification(post, user):
    """Create notification when someone likes a post."""
    create_notification(
        recipient=post.user,
        sender=user,
        notification_type='like',
        post=post
    )

def create_unlike_notification(post, user):
    """Create notification when someone unlikes a post."""
    create_notification(
        recipient=post.user,
        sender=user,
        notification_type='unlike',
        post=post
    )

def create_comment_notification(post, user, comment):
    """Create notification when someone comments on a post."""
    create_notification(
        recipient=post.user,
        sender=user,
        notification_type='comment',
        post=post,
        comment=comment
    )

def create_follow_notification(following_user, follower_user):
    """Create notification when someone follows a user."""
    create_notification(
        recipient=following_user,
        sender=follower_user,
        notification_type='follow'
    )

def create_unfollow_notification(following_user, follower_user):
    """Create notification when someone unfollows a user."""
    create_notification(
        recipient=following_user,
        sender=follower_user,
        notification_type='unfollow'
    )

def signup(request): 
    signup_errors = []
    signup_success = []
    
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        password2 = request.POST.get("password2")
        
        if User.objects.filter(username=username).exists():
            signup_errors.append("Username already exists.")
           
        if User.objects.filter(email=email).exists():
            signup_errors.append("Email already exists.")
            
        if password != password2:
            signup_errors.append("Passwords do not match.")
            return render(request, "signup.html", {"signup_errors": signup_errors})
        
        # All validations passed
        if password == password2:
            user = User.objects.create_user(username=username, email=email, password=password)
            user.save()

            # Log the user in, but do NOT create a profile automatically
            user_login = authenticate(username=username, password=password)
            login(request, user_login)

            signup_success.append(f"Account created successfully! Welcome {username}!")
        return render(request, "signin.html", {"signup_success": signup_success})
            
    return render(request, "signup.html")

def signin(request):
    signin_errors = []
    
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        
        if not username or not password:
            signin_errors.append("Username and password are required.")
            return render(request, "signin.html", {"signin_errors": signin_errors})
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('new_home')
        else:
            signin_errors.append("Invalid login details.")
            return render(request, "signin.html", {"signin_errors": signin_errors})
    
    return render(request, "signin.html")

@login_required(login_url='signin')
def layout(request):
    center_post = post(request.user)
    # Get shared context data
    context_data = get_shared_context(request.user)
    return render(request, "layout.html", context_data, center_post=center_post)

#new home view
@login_required(login_url='signin')
def new_home(request):
    # Get or create user profile (handles case where profile doesn't exist)
    user_profile, created = Profile.objects.select_related('user').get_or_create(user=request.user)

    # Get posts with optimized queries using select_related and prefetch_related
    posts = Post.objects.exclude(user=request.user).select_related('user', 'user__profile').prefetch_related(
        'comments__username__profile'  # Prefetch comments and their authors to avoid N+1 queries
    ).order_by('-created_at')[:20]  # Limit to 20 posts for better performance
    
    # Get the list of post IDs that the current user has liked
    liked_post_ids = LikePost.objects.filter(username=request.user).values_list('post_id', flat=True)
    
    # Add post_comments attribute for template compatibility
    for post in posts:
        post.post_comments = post.comments.all()  # Use prefetched data
    
    # Get shared context data (suggestions and notifications)
    shared_context = get_shared_context(request.user)

    context_data = {
        "user_profile": user_profile, 
        "posts": posts, 
        "liked_post_ids": liked_post_ids,
        "created_at": posts[0].created_at.strftime("%Y-%m-%d %H:%M:%S") if posts else None
    }
    # Add shared context data
    context_data.update(shared_context)

    return render(request, "index_simple.html", context_data)

#View a single post with its details
@login_required(login_url='signin')
def post(request, post_id):
    post = get_object_or_404(Post.objects.select_related('user', 'user__profile').prefetch_related(
        'comments__username__profile',  # Prefetch comments and their authors
        'likes'  # Prefetch likes to optimize like count retrieval
    ), id=post_id)
    
    # Check if the current user has liked this post
    liked = LikePost.objects.filter(post_id=post, username=request.user).exists()
    
    # Get all comments for the post
    comments = post.comments.all().select_related('username', 'username__profile').order_by('created_at')
    
    # Get or create user profile (handles case where profile doesn't exist)
    user_profile, created = Profile.objects.select_related('user').get_or_create(user=request.user)
    
    # Get shared context data (suggestions and notifications)
    shared_context = get_shared_context(request.user)

    context = {
        "post": post,
        "liked": liked,
        "comments": comments,
        "user_profile": user_profile,
        "like_count": post.no_of_likes,
    }
    
    # Add shared context data
    context.update(shared_context)

    return render(request, "post_detail.html", context)

@login_required(login_url='signin')
def logout(request):
    auth_logout(request)
    return redirect('signin')

@login_required(login_url="signin")
def upload(request):
    if request.method == "POST":
        logger.debug("Upload POST request received")
        caption = request.POST.get("caption", "").strip()
        media_file = request.FILES.get("image_upload") or request.FILES.get("video_upload")

        # Validate file size (12MB limit)
        if media_file and media_file.size > 12 * 1024 * 1024:
            messages.error(request, "File size too large. Please select a file smaller than 12MB.")
            return redirect("new_home")

        # Check if there’s content
        if caption or media_file:
            try:
                public_url = None
                if media_file:
                    # ✅ Now handled by utils (no need to manually build path)
                    public_url = upload_to_supabase(media_file, "post")

                new_post = Post.objects.create(
                    user=request.user,
                    caption=caption,
                    media=public_url,   # Supabase URL string
                )

                logger.info(f"Post created: {new_post.id}, Media: {new_post.media}")

                create_post_notification(new_post)

                messages.success(request, "Post uploaded successfully!")

            except Exception as e:
                logger.error(f"Upload failed: {str(e)}")
                messages.error(request, "An error occurred while uploading. Please try again.")
        else:
            messages.error(request, "Please write something or select a file to upload.")

        return redirect("new_home")

    return render(request, "upload.html")

@login_required(login_url='signin')
def delete(request, post_id):
    """Delete a post created by the user."""
    if request.method == "POST":  
        post = get_object_or_404(Post, id=post_id, user=request.user)
        post.delete()
        messages.success(request, "Post deleted successfully.")
    return redirect('profile', pk=request.user.username)

@login_required(login_url='signin')
def profile(request, pk):
    user_object = get_object_or_404(User, username=pk)
    user_profile, created = Profile.objects.get_or_create(user=user_object)
    
    # Get user's posts with optimized queries
    posts = Post.objects.filter(user=user_object).select_related('user').prefetch_related(
        'comments__username__profile'  # Prefetch comments and their authors
    ).order_by('-created_at')[:20]  # Limit posts for better performance
    
    # Add post_comments attribute for template compatibility
    for post in posts:
        post.post_comments = post.comments.all()  # Use prefetched data
    
    # Check if current user is following this user
    is_following = Follow.objects.filter(follower=request.user, following=user_object).exists()
    button_text = "Unfollow" if is_following else "Follow"

    # Get counts efficiently
    post_length = posts.count()
    user_followers = Follow.objects.filter(following=user_object).count()
    user_following = Follow.objects.filter(follower=user_object).count()
    
    # Get liked posts for current user
    liked_post_ids = [like.post_id.id for like in LikePost.objects.filter(username=request.user)]

    context = {
        "user_profile": user_profile,
        "posts": posts,
        "user_object": user_object,
        "post_length": post_length,
        "user_followers": user_followers,
        "user_following": user_following,
        "button_text": button_text,
        "liked_post_ids": liked_post_ids,
    }

    # Get shared context data (suggestions and notifications)
    shared_context = get_shared_context(request.user)

    # Add shared context data
    context.update(shared_context)

    return render(request, "profile.html", context)

@login_required(login_url='signin')
def saved(request):
    """Display all saved posts for the current user."""
    user_profile, created = Profile.objects.get_or_create(user=request.user)
    
    # Get all saved posts with optimized queries
    saved_posts = user_profile.saved_posts.select_related('user', 'user__profile').prefetch_related(
        'comments__username__profile'
    ).order_by('-created_at')
    
    # Add post_comments attribute for template compatibility
    for post in saved_posts:
        post.post_comments = post.comments.all()
    
    # Get liked posts for current user
    liked_post_ids = LikePost.objects.filter(username=request.user).values_list('post_id', flat=True)
    
    # Get shared context data (suggestions and notifications)
    shared_context = get_shared_context(request.user)
    
    context = {
        "user_profile": user_profile,
        "posts": saved_posts,
        "liked_post_ids": liked_post_ids,
        "page_title": "Saved Posts"
    }
    
    # Add shared context data
    context.update(shared_context)
    
    return render(request, "saved.html", context)

@login_required(login_url='signin')
def settings(request):
    try:
        user_profile = Profile.objects.get(user=request.user)
    except Profile.DoesNotExist:
        user_profile = None

    if request.method == "POST":
        works_at = request.POST.get("works_at")
        occupation = request.POST.get("occupation")
        bio = request.POST.get("bio")
        location = request.POST.get("location")
        profilepic = request.FILES.get("image")
        cover_photo = request.FILES.get("cover_photo")

        # a user creating a new profile if it doesn't exist
        if not user_profile:
            user_profile = Profile.objects.create(
                user=request.user,
                works_at=works_at,
                occupation=occupation,
                bio=bio,
                location=location,
                profilepic=profilepic if profilepic else "blank-profile-picture.png",
                cover_photo=cover_photo if cover_photo else ""
            )
        # If the profile already exists, update the fields
        else:
            if profilepic:
                user_profile.profilepic = profilepic
            if cover_photo:
                user_profile.cover_photo = cover_photo
            user_profile.works_at = works_at
            user_profile.occupation = occupation
            user_profile.bio = bio
            user_profile.location = location
            user_profile.save()
        messages.success(request, "Profile updated successfully!")
        return redirect('settings')
    return render(request, "setting.html", {"user_profile": user_profile})

@login_required(login_url='signin')
def like_post(request):
    if request.method == "POST":
        post_id = request.POST.get("post_id")
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return JsonResponse({"success": False, "error": "Post not found"}, status=404)
            
        liked = LikePost.objects.filter(post_id=post, username=request.user).exists()
        if liked:
            # Unlike the post
            LikePost.objects.filter(post_id=post, username=request.user).delete()
            post.no_of_likes = max(0, post.no_of_likes - 1)
            
            # Create unlike notification
            create_unlike_notification(post, request.user)
        else:
            # Like the post
            LikePost.objects.create(post_id=post, username=request.user)
            post.no_of_likes += 1
            
            # Create like notification
            create_like_notification(post, request.user)
        
        post.save()
        
        return JsonResponse({
            "success": True, 
            "liked": not liked, 
            "like_count": post.no_of_likes
        })
    return JsonResponse({"success": False, "error": "Invalid request"}, status=400)

@login_required(login_url='signin')
def comment(request):
    if request.method == "POST":
        post_id = request.POST.get("post_id")
        comment_text = request.POST.get("comment")

        if not comment_text or not comment_text.strip():
            return JsonResponse({"success": False, "error": "Comment cannot be empty"}, status=400)

        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return JsonResponse({"success": False, "error": "Post not found"}, status=404)

        new_comment = Comment.objects.create(post_id=post, username=request.user, comment=comment_text.strip())
        
        # Create comment notification
        create_comment_notification(post, request.user, new_comment)
        
        # Get or create user profile for response
        user_profile, created = Profile.objects.get_or_create(user=request.user)
        
        # Return the comment data for AJAX response
        comment_data = {
            "success": True,
            "comment": {
                "id": new_comment.id,
                "username": new_comment.username.username,
                "comment": new_comment.comment,
                "created_at": new_comment.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                # profilepic is a URL string now
                "profile_pic": user_profile.profilepic if user_profile.profilepic else "/media/profile_pics/blank-profile-picture.png"
                
            }
        }
        return JsonResponse(comment_data)
    return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)

@login_required(login_url='signin')
def save_post(request):
    if request.method == "POST":
        post_id = request.POST.get("post_id")
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return JsonResponse({"success": False, "error": "Post not found"}, status=404)
        
        # Get or create user profile
        user_profile, created = Profile.objects.get_or_create(user=request.user)
        
        # Check if post is already saved
        is_saved = user_profile.saved_posts.filter(id=post_id).exists()
        
        if is_saved:
            # Unsave the post
            user_profile.saved_posts.remove(post)
            saved = False
            message = "Post removed from saved posts"
        else:
            # Save the post
            user_profile.saved_posts.add(post)
            saved = True
            message = "Post saved successfully"
        
        return JsonResponse({
            "success": True,
            "saved": saved,
            "message": message
        })
    return JsonResponse({"success": False, "error": "Invalid request"}, status=400)

@login_required(login_url='signin')
def suggested_users(request):
    user = request.user
    
    # Get users who are not the current user and not already followed
    followed_users = Follow.objects.filter(follower=user).values_list('following', flat=True)
    potential_users = User.objects.exclude(id=user.id).exclude(id__in=followed_users).select_related('profile')
    
    # Limit to 5 suggestions
    suggestions = list(potential_users[:5])
    random.shuffle(suggestions)  # Shuffle to randomize suggestions

    return render(request, "new_home.html", {"suggestions": suggestions})

@login_required(login_url='signin')
def search(request):
    user_object = User.objects.get(username=request.user.username)
    try:
        user_profile = Profile.objects.get(user=user_object)
    except Profile.DoesNotExist:
        user_profile = Profile.objects.create(user=user_object)
    
    username_profile_list = []
    username = ""

    # Get shared context data (suggestions and notifications)
    shared_context = get_shared_context(request.user)

    context_data = {
        "user_profile": user_profile, 
        "username_profile_list": username_profile_list,
        "username": username,
    }
    
    # Add shared context data
    context_data.update(shared_context)
    
    if request.method == "POST":
        username = request.POST.get("username")
        
        if username:
            # Get users whose username contains the search term
            username_object = User.objects.filter(username__icontains=username)
            
            # Get profiles for these users
            for user in username_object:
                try:
                    profile = Profile.objects.get(user=user)
                    username_profile_list.append(profile)
                except Profile.DoesNotExist:
                    # Skip users without profiles
                    continue

    return render(request, "search.html", context_data)

def debug_users(request):
    users = User.objects.all()
    user_list = [{"username": user.username, "email": user.email} for user in users]
    return JsonResponse({"users": user_list})

@login_required(login_url='signin')
def follow(request):
    if request.method == "POST":
        following = request.POST.get("following")
        follower = request.POST.get("follower")

        following_user = User.objects.get(username=following)
        follower_user = User.objects.get(username=follower)

        if not Follow.objects.filter(follower__username=follower, following__username=following).exists():
            # Follow the user
            engage, created = Follow.objects.get_or_create(
                follower=follower_user,
                following=following_user
            )
            
            # Create follow notification
            create_follow_notification(following_user, follower_user)
            
            return redirect('profile', pk=following)
        else:
            # Unfollow the user
            disengage = Follow.objects.filter(follower__username=follower, following__username=following)
            disengage.delete()
            
            # Create unfollow notification
            create_unfollow_notification(following_user, follower_user)
            
            return redirect('profile', pk=following)

    return redirect('profile', pk=following)

@login_required(login_url='signin')
def delete_notification(request, notification_id):
    """Delete a specific notification."""
    if request.method == 'POST':
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=request.user  # Ensure user can only delete their own notifications
            )
            notification.delete()
            return JsonResponse({'success': True, 'message': 'Notification deleted successfully.'})
        except Notification.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Notification not found.'}, status=404)
    
    return JsonResponse({'success': False, 'message': 'Invalid request method.'}, status=405)