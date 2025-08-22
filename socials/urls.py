from django.urls import path
from  . import views

urlpatterns = [
    # The root URL now renders index.html via the home view
    path("", views.new_home, name="new_home"),
    path("signin", views.signin, name="signin"),
    path("signup", views.signup, name="signup"),
    path("logout", views.logout, name="logout"),
    path("profile/<str:pk>", views.profile, name="profile"),
    path("upload", views.upload, name="upload"),
    path("delete/<uuid:post_id>", views.delete, name="delete"),
    path("like_post/", views.like_post, name="like_post"),
    path("comment/", views.comment, name="comment"),
    path("settings", views.settings, name="settings"),
    path("search", views.search, name="search"),
    path("debug/users", views.debug_users, name="debug_users"),
    path("follow", views.follow, name="follow"),
    path("notifications/delete/<int:notification_id>/", views.delete_notification, name="delete_notification"),
    path("layout", views.layout, name="layout")
]
