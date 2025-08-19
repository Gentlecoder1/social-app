from itertools import chain
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout as auth_logout
from django.contrib.auth.models import User
from .models import Profile, Post, LikePost, Comment, Follow
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
import random

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
    
    # Get suggested users (optimized version)
    followed_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
    suggestions = User.objects.select_related('profile').exclude(
        id=request.user.id
    ).exclude(id__in=followed_users)[:5]

    context_data = {
        "user_profile": user_profile, 
        "posts": posts, 
        "liked_post_ids": liked_post_ids,
        "suggestions": suggestions,
        "created_at": posts[0].created_at.strftime("%Y-%m-%d %H:%M:%S") if posts else None
    }
    
    return render(request, "index_simple.html", context_data)

def signin(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        
        if not username or not password:
            return render(request, "signin.html", {"messages": ["Username and password are required."]})
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            if Profile.objects.filter(user=user).exists():
                return redirect('new_home')
            else:
                return redirect('settings')
        else:
            return render(request, "signin.html", {"messages": ["Invalid login details."]})
    
    return render(request, "signin.html")

def signup(request): 
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        password2 = request.POST.get("password2")
        
        if User.objects.filter(username=username).exists():
            return render(request, "signup.html", {"messages": ["Username already exists."]})
        if User.objects.filter(email=email).exists():
            return render(request, "signup.html", {"messages": ["Email already exists."]})
        if password == password2:
            user = User.objects.create_user(username=username, email=email, password=password)
            user.save()

            # Create a profile for the new user
            user_login = authenticate(username=username, password=password)
            login(request, user_login)

            Profile.objects.create(user=user)
            messages.success(request, f"User {username} signed up successfully!")
            return redirect("signin")
        else:
            return render(request, "signup.html", {"error": "Passwords do not match."})
    return render(request, "signup.html")

@login_required(login_url='signin')
def logout(request):
    auth_logout(request)
    return redirect('signin')

@login_required(login_url='signin')
def upload(request):
    if request.method == "POST":
        print("DEBUG: Upload POST request received")
        user = request.user.username
        caption = request.POST.get("caption", "").strip()
        media_file = request.FILES.get("image_upload") or request.FILES.get("video_upload")
        
        print(f"DEBUG: Caption: '{caption}'")
        print(f"DEBUG: Media file: {media_file}")
        print(f"DEBUG: request.FILES: {request.FILES}")

        # Validate file size (12MB limit)
        if media_file and media_file.size > 12 * 1024 * 1024:
            messages.error(request, "File size too large. Please select a file smaller than 10MB.")
            return redirect('new_home')

        # Check if there's content to post (caption or media)
        if caption or media_file:
            try:
                new_post = Post.objects.create(
                    user=request.user, 
                    caption=caption, 
                    media=media_file
                )
                print(f"DEBUG: Post created successfully. ID: {new_post.id}, Media: {new_post.media}")
                
                if media_file:
                    messages.success(request, f"Post with {new_post.media_type} uploaded successfully!")
                else:
                    messages.success(request, "Post uploaded successfully!")
                    
            except ValidationError as e:
                print(f"DEBUG: ValidationError: {str(e)}")
                messages.error(request, f"Upload failed: {str(e)}")
            except Exception as e:
                print(f"DEBUG: Exception: {str(e)}")
                messages.error(request, "An error occurred while uploading. Please try again.")
                
        else:
            print("DEBUG: No caption or media file provided")
            messages.error(request, "Please write something or select a file to upload.")
        
        return redirect('new_home')
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
    
    return render(request, "profile.html", context)

@login_required(login_url='signin')
def settings(request):
    user_profile, created = Profile.objects.get_or_create(user=request.user)
    if request.method == "POST":
        works_at = request.POST.get("works_at")
        occupation = request.POST.get("occupation")
        bio = request.POST.get("bio")
        location = request.POST.get("location")
        if request.FILES.get("image"):
            user_profile.profilepic = request.FILES["image"]
        if request.FILES.get("cover_photo"):
            user_profile.cover_photo = request.FILES["cover_photo"]
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
            LikePost.objects.filter(post_id=post, username=request.user).delete()
            post.no_of_likes = max(0, post.no_of_likes - 1)
        else:
            LikePost.objects.create(post_id=post, username=request.user)
            post.no_of_likes += 1
        
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
                "profile_pic": user_profile.profilepic.url if user_profile.profilepic else "/media/profile_pics/blank-profile-picture.png"
                
            }
        }
        return JsonResponse(comment_data)
    return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)

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

    return render(request, "search.html", {
        "user_profile": user_profile, 
        "username_profile_list": username_profile_list,
        "username": username
    })

def debug_users(request):
    users = User.objects.all()
    user_list = [{"username": user.username, "email": user.email} for user in users]
    return JsonResponse({"users": user_list})

@login_required(login_url='signin')
def follow(request):
    if request.method == "POST":
        following = request.POST.get("following")
        follower = request.POST.get("follower")

        if not Follow.objects.filter(follower__username=follower, following__username=following).exists():
            engage, created = Follow.objects.get_or_create(
                follower=User.objects.get(username=follower),
                following=User.objects.get(username=following)
            )
            # No need to call save() since get_or_create already saves the object
            return redirect('profile', pk=following)
        else:
            disengage = Follow.objects.filter(follower__username=follower, following__username=following)
            disengage.delete()
            return redirect('profile', pk=following)

    return redirect('profile', pk=following)