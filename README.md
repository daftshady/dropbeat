Dropbeat: Web music player
==========================

Dropbeat is open-source web music player that lets you listen to music in online streaming sources better.

We all are tired of crappy youtube playlist, horrible UX of soundcloud in which even single-track repeat is impossible.

You can search music from multiple streaming sources and manage, share playlist with standard music player interface.

![alt tag](https://s3-ap-northeast-1.amazonaws.com/dropbeat-oss/dropbeat.jpg)


Development
===========

Dropbeat has been developed on ubuntu, osx machine.

To run dropbeat in your local environment,

1. Clone this repository.
2. Run `pip install -r requirements.txt` to install python dependencies.
3. Set database env variables in `settings.py` accordingly. You may need to install mysql in this step. (Or you can use sqlite by setting `DBT_TEST` flag.)
4. Create database named as `dropbeat` and execute `python manage.py migrate`. 
5. `python manage.py runserver [host]:[port]` will run the server in debug mode.

There are apis which rely on 3rd party services such as youtube api.

They should run asynchronously and that's why there are celery broker, redis configurations in the `settings.py`.

But in debug mode, all apis run synchronously so that we don't need to run message broker and celery worker while developing it.


Test
====

There are few testcases which show basic usage of each api.

To run it, you should install `docker` and `docker-compose` first.

After that, `run-docker-test.sh` will execute simple integration tests on virtual ubuntu environment.


Compatibility
=============

Dropbeat works well on chrome, safari and firefox. 

Internet explorer is not supported. (Actually, we haven't even tried it because we don't have any interest in it.)

Javascript modules are based on ES5. 

Also, api server is based on python 2 and we definitely have a plan to support python 3 too.


License
=======

This project is licensed under MIT License.


Authors
=======

Ilsu Park [@daftshady](http://github.com/daftshady)

Eugene C. Lee [@lordpeara](http://github.com/lordpeara)
