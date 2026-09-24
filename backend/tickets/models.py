from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('CLIENT', 'Client'),
        ('FACILITY_MANAGER', 'Facility Manager'),
        ('DEPARTMENT_POC', 'Department POC'),
        ('TECH_MANAGER', 'Technical Manager'),
        ('TECHNICIAN', 'Technician'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CLIENT')

# FIX: Corrected to models.Model
class Ticket(models.Model): 
    STATUS_CHOICES = (
        ('OPEN', 'Open'),
        ('PENDING_TECH_ASSIGNMENT', 'Pending Tech Assignment'),
        ('PENDING_TECH_ASSESSMENT', 'Pending Tech Assessment'),
        ('PENDING_POC_REVIEW', 'Pending POC Review'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    )
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    floors = models.CharField(max_length=100, blank=True, null=True)
    concerned_department = models.CharField(max_length=100, blank=True, null=True)
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='OPEN', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tickets')
    facility_manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_tickets')
    department_poc = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='poc_tickets')
    current_assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')

class TicketAuditLog(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.TextField()
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_comment = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)