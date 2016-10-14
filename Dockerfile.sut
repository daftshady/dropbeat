FROM python:2.7

RUN apt-get update && apt-get install -y openssl curl

RUN pip install requests

WORKDIR /sut

ADD test /sut/
