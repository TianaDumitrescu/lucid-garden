# Lucid Garden ⏰😴
Holds the code for the application Lucid Garden! Within it, users set-up an alarm schedule and gain points for waking up early and on time, but lose points for waking up overtime! They can then utilize their wake-up streaks in order to level up their virtual pets, called Lucids! 

In order to properly setup and run the application locally, users must first ensure that they have Python and Pip installed. Then, they can use pip to get Django so that they have all necessary dependencies. They can then clone the main branch of the repository onto the computer.

```
pip install django
git clone https://github.com/TianaDumitrescu/lucid-garden.git
```

Note: Alternatively, users can extract the zip file instead of git clone. Regardless, the following steps will be the same.
Once the repository has been properly cloned, users can then enter the application in their command line using the command:

```
cd /lucid-garden/django_src
```

Finally, they will need to actually make the proper migrations within this source folder, and then they can run the application.
```
python manage.py migrate
python manage.py makemigration
python manage.py runserver
```
The users should then get a response that looks like the following: 

```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
April 20, 2026 - 21:34:01
Django version 6.0.3, using settings 'core.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```


They can click on the http://127.0.0.1:8000/ link and that should take them to the site that the computer is hosting the application on.

