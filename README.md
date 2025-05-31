# Regalia Dulce

<img width="200px" height="200px" align="center"  src="https://regalia-dulce.s3.us-east-1.amazonaws.com/shop/icon/logo.png">

Regalia Dulce is a web application developed as part of a bachelor's thesis project.

The platform is designed for a premium American chocolaterie, offering and elegant and simple user experience.

## Key Features
#### * Interactive product catalog with detailed pages and dynamic offers


#### * Shopping cart and favorites functionality


#### * Review and rating system for each product


#### * Admin dashboard with product statistics and exportable reports


#### * Scheduled tasks for process automatization


#### * Stripe integration for payment simulation


#### * File handling via AWS S3 for media and static files

## Tech Stack
#### * Backend: Python, Django, MySQL


#### * Frontend: HTML, CSS, JavaScript


#### * Other Tools: Django Q2, Stripe API, Boto3 (AWS S3), PostHog

## Installation
#### First you should make sure that everything like programing language, frameworks, libraries, packages, etc. is set up

>In this case the project structure consists in Python which can be installed from its respective site: https://www.python.org/downloads/

>You will also need a development environment (IDE) use pycharm: https://www.jetbrains.com/pycharm/

Activate the virtual environment in the settings before working on your projects.

Install requirements.txt:
```bash
# Install packages
pip install -r requirements.txt
```

###  Set up the database 

>Visit the official MySQL download page and install MySQL Community Server and MySQL Workbench: https://dev.mysql.com/downloads/

>Launch MySQL Workbench, create a new connection profile by specifying the host, port, username, and password and connect to the server

You will need to create a AWS account after that create a s3 bucket and a IAM user and give him the permission necessary for him to access the bucket.

### The application uses several third-party APIs

####  Amazon S3
Stores product images, user uploaded files and static assets using AWS S3.

If you wish you can set your own S3 bucket or leave the regalia-dulce one to access the general static files, you will still be able to use the site by saving static files locally.

#### Stripe
Simulates the payment processing during checkout.

The site can technically run without it, but you should make a stripe account if you want not just the checkout functionality but also the payment statistics that come with it.

#### PostHog
Tracks user page visits, searches or scheduled task behavior for analytics.

It's optional and the application can be used without affecting functionality.

### Set up your env file 

```bash
# Generate a secret key or use https://djecrety.ir/
python manage.py generate_secret_key
```

You will need the to create a .env file in the root folder which should look like this:
```
SECRET_KEY='Your_secret_key'

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER='Your_email_address'
EMAIL_HOST_PASSWORD='Your_email_password'

ENGINE=django.db.backends.mysql
NAME='Your_database'
USER='Your_username'
PASSWORD='Your_password',
HOST=localhost
PORT=3306

AWS_ACCESS_KEY_ID='Your_users_secret_key'
AWS_SECRET_ACCESS_KEY='Your_users_secret_access_key'
AWS_STORAGE_BUCKET_NAME='regalia-dulce'
AWS_S3_FILE_OVERWRITE=False
AWS_DEFAULT_FILE_STORAGE=storages.backends.s3boto3.S3Boto3Storage

STRIPE_PUBLIC_KEY='Your Stripe public key'
STRIPE_SECRET_KEY='Your Stripe secret key'

POSTHOG_API_KEY='Your PostHog key'
POSTHOG_HOST=https://eu.posthog.com
```
### Now you should have everything set up and the server should work just fine.

```bash
# Start the server
python run.py
```