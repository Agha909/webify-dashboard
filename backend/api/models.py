from django.db import models
from django.contrib.auth.models import User


class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    text = models.TextField(blank=True)
    # store image as base64 (per request) - consider switching to ImageField later
    image_base64 = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField(User, related_name='liked_posts', blank=True)

    def likes_count(self):
        return self.likes.count()

    def __str__(self):
        return f"Post {self.pk} by {self.author.username}"
