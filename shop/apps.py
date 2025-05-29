from django.apps import AppConfig
from django.utils.module_loading import import_string
from django.utils import timezone


class ShopConfig(AppConfig):
    name = 'shop'

    def ready(self):
        schedule = import_string('django_q.models.Schedule')

        tasks_to_schedule = [
            ('Deactivate expired offers', 'shop.tasks.deactivate_expired_offers'),
            ('Delete deactivated offers', 'shop.tasks.delete_deactivated_offers'),
            ('Delete expired or used-up coupons', 'shop.tasks.delete_expired_or_used_up_coupons')
        ]

        for name, func in tasks_to_schedule:
            try:
                existing_schedule = schedule.objects.get(name=name)
                existing_schedule.next_run = timezone.now()
                existing_schedule.save()
                print(f"Updated next run time for schedule: {name}")
            except schedule.DoesNotExist:
                if name == 'Deactivate expired offers':
                    schedule.objects.create(
                        func='shop.tasks.deactivate_expired_offers',
                        name='Deactivate expired offers',
                        schedule_type=schedule.MINUTES,
                        minutes=1,
                        next_run=timezone.now()
                    )
                    print(f"Created schedule: {name}")
                elif name == 'Delete deactivated offers':
                    schedule.objects.create(
                        func='shop.tasks.delete_deactivated_offers',
                        name='Delete deactivated offers',
                        schedule_type=schedule.MINUTES,
                        minutes=1,
                        next_run=timezone.now()
                    )
                    print(f"Created schedule: {name}")
                elif name == 'Delete expired or used-up coupons':
                    schedule.objects.create(
                        func='shop.tasks.delete_expired_or_used_up_coupons',
                        name='Delete expired or used-up coupons',
                        schedule_type=schedule.MINUTES,
                        minutes=1,
                        next_run=timezone.now()
                    )
                    print(f"Created schedule: {name}")
