from django import template

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
