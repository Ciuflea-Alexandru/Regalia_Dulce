import posthog
from django.utils import timezone
from shop.models import Offer, Coupon
from django.db.models import Q
from django.conf import settings

posthog.project_api_key = settings.POSTHOG_API_KEY
posthog.host = settings.POSTHOG_HOST


def deactivate_expired_offers():
    expired_offers = Offer.objects.filter(end_date__lt=timezone.now(), active=True)
    count = expired_offers.count()
    for offer in expired_offers:
        offer.active = False
        offer.save()

    posthog.capture(
        'system',
        'deactivated_expired_offers',
        {'count': count}
    )


def delete_deactivated_offers():
    deactivated_offers = Offer.objects.filter(active=False)
    count = deactivated_offers.count()
    for offer in deactivated_offers:
        offer.delete()

    posthog.capture(
        'system',
        'deleted_deactivated_offers',
        {'count': count}
    )


def delete_expired_or_used_up_coupons():
    coupons = Coupon.objects.filter(
        Q(end_date__lt=timezone.now()) | Q(usage_limit=0)
    )
    count = coupons.count()
    for coupon in coupons:
        coupon.delete()

    posthog.capture(
        'system',
        'deleted_expired_or_used_up_coupons',
        {'count': count}
    )


