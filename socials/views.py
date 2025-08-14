from itertools import chain
from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout as auth_logout
from django.contrib.auth.models import User
from .models import Profile, Post, LikePost, Comment, Follow
from django.contrib.auth.decorators import login_required
import random

#new home view
@login_required(login_url='signin')
def new_home(request):
    # Get user profile
    user_profile = Profile.objects.get(user=request.user)

    # Get posts (excluding current user's posts)
    posts = Post.objects.exclude(user=request.user).order_by('-created_at')
    
    # Get the list of post IDs that the current user has liked
    liked_post_ids = LikePost.objects.filter(username=request.user).values_list('post_id', flat=True)
    
    # Get comments for each post
    for post in posts:
        post.post_comments = Comment.objects.filter(post_id=post).order_by('created_at')
    
    # Get suggested users (simple version)
    followed_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
    suggestions = User.objects.exclude(id=request.user.id).exclude(id__in=followed_users)[:5]

    return render(request, "index_simple.html", {
        "user_profile": user_profile, 
        "posts": posts, 
        "liked_post_ids": liked_post_ids,
        "suggestions": suggestions,
        "created_at": posts[0].created_at.strftime("%Y-%m-%d %H:%M:%S") if posts else None
    })

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
        user = request.user.username
        caption = request.POST.get("caption")
        media_file = request.FILES.get("image_upload") or request.FILES.get("video_upload")

        # Check if there's content to post (caption or media)
        if caption or media_file:
            new_post = Post.objects.create(user=request.user, caption=caption, media=media_file)
            new_post.save()
            messages.success(request, "Post uploaded successfully!")
        else:
            messages.error(request, "Please write something or select a file to upload.")
        
        return redirect('new_home')
    return render(request, "upload.html")

@login_required(login_url='signin')
def profile(request, pk):
    try:
        user_object = User.objects.get(username=pk)
        user_profile = Profile.objects.get(user=user_object)
    except User.DoesNotExist:
        messages.error(request, f"User '{pk}' does not exist.")
        return redirect('home')
    except Profile.DoesNotExist:
        messages.error(request, f"Profile for user '{pk}' does not exist.")
        return redirect('home')
    
    # Get user's posts with comments and their users prefetched
    posts = Post.objects.filter(user=user_object).prefetch_related(
        'comments__username__profile',  # Prefetch comment authors and their profiles
        'likes'  # Prefetch likes for efficiency
    ).order_by('-created_at')
    
    # Add comments to each post (for template compatibility)
    for post in posts:
        post.post_comments = Comment.objects.filter(post_id=post).order_by('created_at')

    # Check if current user is following this user
    is_following = Follow.objects.filter(follower=request.user, following=user_object).exists()
    button_text = "Unfollow" if is_following else "Follow"

    # Get counts
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
            action = "unliked"
        else:
            LikePost.objects.create(post_id=post, username=request.user)
            post.no_of_likes += 1
            action = "liked"
        post.save()
        
        return JsonResponse({"success": True, "no_of_likes": post.no_of_likes, "action": action})
        
    return JsonResponse({"success": False, "error": "Invalid request method"}, status=405)

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
        
        # Get user profile for response
        user_profile = Profile.objects.get(user=request.user)
        
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