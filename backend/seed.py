import os
import django

# Initialize Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from tickets.models import User, Ticket, TicketAuditLog

def run_seed():
    print("Clearing old data...")
    User.objects.all().delete()
    Ticket.objects.all().delete()

    print("Creating Admin Superuser...")
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')

    print("Creating Specific PDF Role Users...")
    # Client
    client = User.objects.create_user(username='chaitya_m', password='password123', role='CLIENT')
    
    # Facility Manager
    fm = User.objects.create_user(username='chandan_s', password='password123', role='FACILITY_MANAGER')
    
    # Department POC
    dept_poc = User.objects.create_user(username='dept_poc', password='password123', role='DEPARTMENT_POC', department='Facilities')
    
    # Technical Manager
    tech_mgr = User.objects.create_user(username='dhananjaya_m', password='password123', role='TECH_MANAGER')
    
    # Technician
    tech = User.objects.create_user(username='prakash_k', password='password123', role='TECHNICIAN')

    print("Generating Sample Workflow Tickets...")
    for i in range(1, 26):
        # Alternate statuses to demonstrate filtering
        status = 'OPEN'
        assignee = None
        if i % 3 == 0:
            status = 'PENDING_TECH_ASSIGNMENT'
            assignee = tech_mgr
        elif i % 4 == 0:
            status = 'PENDING_TECH_ASSESSMENT'
            assignee = tech

        ticket = Ticket.objects.create(
            title=f"Ticket #{i} - AC not cooling" if i % 2 == 0 else f"Ticket #{i} - Internet Not Working",
            description="The units are running but producing warm air. Multiple clients are complaining.",
            floors="2F, 3F",
            client=client,
            facility_manager=fm,
            concerned_department="Facilities" if i % 2 == 0 else "IT",
            department_poc=dept_poc,
            current_assignee=assignee,
            status=status,
        )
        
        # Generate the initial audit log
        TicketAuditLog.objects.create(
            ticket=ticket,
            action="System auto-assigned the ticket.",
            performed_by=client
        )
    
    print("✅ Seed data successfully loaded!")

if __name__ == '__main__':
    run_seed()