from django.urls import path
from . import views

urlpatterns = [
    path('profile/store/', views.profile_store),
    path('download/resume/<int:file_id>/', views.download_resume),
    path('interview/store/', views.interview_store, name='interview_store'),
]
