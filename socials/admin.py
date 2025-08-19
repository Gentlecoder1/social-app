from django.contrib import admin
from .models import Profile, Post, LikePost, Comment, Follow

# Profile Admin
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'works_at', 'occupation', 'location')
    list_filter = ('occupation', 'location')
    search_fields = ('user__username', 'user__email', 'works_at', 'occupation')
    readonly_fields = ('user',)

# Post Admin
@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('user', 'caption_preview', 'media_type', 'created_at', 'no_of_likes')
    list_filter = ('media_type', 'created_at', 'user')
    search_fields = ('user__username', 'caption')
    readonly_fields = ('id', 'created_at', 'no_of_likes')
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    def caption_preview(self, obj):
        return obj.caption[:50] + "..." if len(obj.caption) > 50 else obj.caption
    caption_preview.short_description = 'Caption Preview'

# LikePost Admin
@admin.register(LikePost)
class LikePostAdmin(admin.ModelAdmin):
    list_display = ('username', 'post_id', 'post_user')
    list_filter = ('post_id__user', 'post_id__created_at')
    search_fields = ('username__username', 'post_id__caption')
    
    def post_user(self, obj):
        return obj.post_id.user.username
    post_user.short_description = 'Post Owner'

# Comment Admin
@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('username', 'comment_preview', 'post_user', 'created_at')
    list_filter = ('created_at', 'post_id__user')
    search_fields = ('username__username', 'comment', 'post_id__caption')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    def comment_preview(self, obj):
        return obj.comment[:30] + "..." if len(obj.comment) > 30 else obj.comment
    comment_preview.short_description = 'Comment'
    
    def post_user(self, obj):
        return obj.post_id.user.username
    post_user.short_description = 'Post Owner'

# Follow Admin
@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ('follower', 'following', 'relationship_info')
    list_filter = ('follower', 'following')
    search_fields = ('follower__username', 'following__username')
    
    def relationship_info(self, obj):
        return f"{obj.follower.username} → {obj.following.username}"
    relationship_info.short_description = 'Relationship'
