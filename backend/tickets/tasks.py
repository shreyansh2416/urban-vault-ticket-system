from celery import shared_task
from celery.exceptions import MaxRetriesExceededError
from django.core.cache import cache
import time
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def process_ticket_notification_async(self, ticket_id, action_description):
    lock_id = f"ticket_notification_lock_{ticket_id}"
    
    if not cache.add(lock_id, "locked", 300):
        logger.warning(f"Duplicate execution prevented: Task for ticket {ticket_id} is already processing.")
        return "Duplicate execution prevented"

    try:
        time.sleep(2)
        logger.info(f"Successfully processed async notification for ticket {ticket_id}: {action_description}")
        return "Success"
        
    except Exception as exc:
        logger.error(f"Task failed for ticket {ticket_id}: {str(exc)}")
        try:
            countdown_time = 2 ** self.request.retries
            self.retry(exc=exc, countdown=countdown_time)
        except MaxRetriesExceededError:
            logger.error(f"Max retries exceeded for ticket {ticket_id} notification.")
            raise
    finally:
        cache.delete(lock_id)