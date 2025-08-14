from django import template
from django.utils import timezone
from datetime import datetime

register = template.Library()

@register.filter
def isin(value, arg):
    """
    Check if a value is in a list/collection
    Usage: {{ value|isin:collection }}
    """
    if arg is None:
        return False
    try:
        return value in arg
    except (TypeError, ValueError):
        return False

@register.filter
def short_timesince(value):
    """
    Returns a short version of timesince
    Examples: 43m, 1h, 2d, 3w
    """
    if not value:
        return ""
    
    now = timezone.now()
    diff = now - value
    
    seconds = diff.total_seconds()
    
    if seconds < 60:
        return "now"
    elif seconds < 3600:  # less than 1 hour
        minutes = int(seconds // 60)
        return f"{minutes}m"
    elif seconds < 86400:  # less than 1 day
        hours = int(seconds // 3600)
        return f"{hours}h"
    elif seconds < 604800:  # less than 1 week
        days = int(seconds // 86400)
        return f"{days}d"
    else:  # more than 1 week
        weeks = int(seconds // 604800)
        return f"{weeks}w"
