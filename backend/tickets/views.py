from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from .models import Ticket, TicketAuditLog
from .serializers import TicketSerializer

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'client', 'concerned_department', 'facility_manager']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Ticket.objects.select_related(
            'client', 'facility_manager', 'department_poc', 'current_assignee'
        ).prefetch_related('activity_logs')
        
        tab = self.request.query_params.get('tab')
        if tab == 'open':
            qs = qs.exclude(status__in=['RESOLVED', 'CLOSED'])
        elif tab == 'closed':
            qs = qs.filter(status__in=['RESOLVED', 'CLOSED'])
            
        user = self.request.user
        if user.is_superuser:
            return qs
            
        if user.role == 'CLIENT':
            return qs.filter(client=user)
        elif user.role == 'FACILITY_MANAGER':
            return qs.filter(facility_manager=user)
        elif user.role == 'DEPARTMENT_POC':
            return qs.filter(department_poc=user)
        elif user.role == 'TECH_MANAGER':
            return qs.filter(current_assignee=user) | qs.filter(status='PENDING_TECH_ASSIGNMENT')
        elif user.role == 'TECHNICIAN':
            return qs.filter(current_assignee=user)
        return qs

    @transaction.atomic
    def perform_create(self, serializer):
        ticket = serializer.save(client=self.request.user)
        
        TicketAuditLog.objects.create(
            ticket=ticket,
            action=f"{self.request.user.username} created the ticket.",
            performed_by=self.request.user
        )
        TicketAuditLog.objects.create(
            ticket=ticket,
            action="System auto-assigned the ticket.",
            performed_by=None
        )

    @action(detail=True, methods=['post'])
    def workflow_action(self, request, pk=None):
        ticket = self.get_object()
        user = request.user
        action_type = request.data.get('action_type')
        note = request.data.get('note', '')

        # Technical Manager Actions
        if action_type == 'assign_worker':
            ticket.status = 'PENDING_TECH_ASSESSMENT'
            ticket.save()
            TicketAuditLog.objects.create(ticket=ticket, action=f"{user.username} assigned technician.", performed_by=user)
            
        elif action_type == 'change_department':
            ticket.status = 'PENDING_POC_REVIEW'
            ticket.save()
            TicketAuditLog.objects.create(ticket=ticket, action=f"{user.username} changed department. Note: {note}", performed_by=user)
            
        # Technician Actions
        elif action_type in ['fully_resolved', 'partially_resolved']:
            ticket.status = 'RESOLVED'
            ticket.save()
            TicketAuditLog.objects.create(ticket=ticket, action=f"{user.username} marked issue as {action_type.replace('_', ' ')}. Note: {note}", performed_by=user)
            
        elif action_type == 'suggest_change':
            ticket.status = 'PENDING_POC_REVIEW'
            ticket.save()
            TicketAuditLog.objects.create(ticket=ticket, action=f"{user.username} suggested department/worker change. Note: {note}", performed_by=user)
            
        # Global Actions
        elif action_type == 'add_comment':
            TicketAuditLog.objects.create(ticket=ticket, action=f"Comment: {note}", performed_by=user, is_comment=True)
            
        return Response({'status': 'success', 'ticket_status': ticket.status})