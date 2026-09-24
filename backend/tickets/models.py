from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = [
        ('CLIENT', 'Client POC'),
        ('FACILITY_MANAGER', 'Facility Manager'),
        ('DEPARTMENT_POC', 'Department POC'),
        ('TECH_MANAGER', 'Technical Manager'),
        ('TECHNICIAN', 'Technician'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    department = models.CharField(max_length=100, blank=True, null=True)

class Ticket(models.Model):
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('PENDING_TECH_ASSIGNMENT', 'Pending Technician Assignment'),
        ('PENDING_TECH_ASSESSMENT', 'Pending Technician Assessment'),
        ('PENDING_POC_REVIEW', 'Pending Department POC Review'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    floors = models.CharField(max_length=255, blank=True, null=True)
    
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='client_tickets')
    facility_manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='managed_tickets')
    concerned_department = models.CharField(max_length=100, blank=True, null=True)
    department_poc = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='poc_tickets')
    current_assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_tickets')
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='OPEN')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class TicketAuditLog(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=255)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    is_comment = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)