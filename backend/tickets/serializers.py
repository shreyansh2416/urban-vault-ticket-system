from rest_framework import serializers
from .models import Ticket, TicketAuditLog

class TicketAuditLogSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.username', read_only=True)

    class Meta:
        model = TicketAuditLog
        fields = ['id', 'action', 'performed_by_name', 'is_comment', 'created_at']

class TicketSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.username', read_only=True)
    facility_manager_name = serializers.CharField(source='facility_manager.username', read_only=True)
    department_poc_name = serializers.CharField(source='department_poc.username', read_only=True)
    current_assignee_name = serializers.CharField(source='current_assignee.username', read_only=True)
    
    # Embeds the activity history directly into the ticket response
    activity_logs = TicketAuditLogSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ['client', 'status', 'created_at', 'updated_at']