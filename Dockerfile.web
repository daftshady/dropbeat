FROM python:2.7

RUN apt-get update && apt-get install -y python-mysqldb

WORKDIR /app

RUN pip install django==1.10.2 enum34 mysql-python requests bs4 celery

ADD . /app

EXPOSE 8000
