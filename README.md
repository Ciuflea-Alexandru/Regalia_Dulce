# my_auth_site

This site is a project that ive been working on for around a year, it allows you to create, update and manage multiple users futuring easy access and modification of the automated database once setup

This site has been made in scope of expanding my knowledge in the web development domain and is intended to be deployed only in development 

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
>Visit the official MySQL download page and install MySQL Community Server and MySQL Workbench: https://dev.mysql.com/downloads/

>Launch MySQL Workbench, create a new connection profile by specifying the host, port, username, and password and connect to the server

### When it comes for the database automation the project uses cron which is specific to unix like systems

First grant permission to the script file:
```bash
# Grant permission
chmod 750 run_cron.sh
```
After that set up the job:
```bash
# Enter the job scheduler
crontab -e
```
```bash
# Schedule a job
0 0 * * * /home/alex/Project/my_auth_site/run_cron.sh
```
###  Set up the database 
You will need the to create a .env file in the root folder with you own information which should look this:
```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER='your_email_address'
EMAIL_HOST_PASSWORD='your_email_password'

ENGINE=django.db.backends.mysql
NAME='your_database'
USER='your_username'
PASSWORD='your_password',
HOST=localhost
PORT=3306

SECRET_KEY='your_secret_key' 
```
```bash
# Generate a secret key
python manage.py generate_secret_key
```
### Now you should have everything set up and the server should work just fine.

```bash
# Start the server
python manage.py runserver
```