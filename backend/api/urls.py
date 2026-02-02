from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='api-register'),
    path('login/', views.LoginView.as_view(), name='api-login'),
    path('logout/', views.LogoutView.as_view(), name='api-logout'),
    path('posts/', views.PostListCreateView.as_view(), name='api-posts'),
    path('posts/<int:pk>/', views.PostDetailView.as_view(), name='api-post-detail'),
    path('posts/<int:pk>/like/', views.ToggleLikeView.as_view(), name='api-post-like'),
]
