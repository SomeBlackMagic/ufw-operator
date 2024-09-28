# Dockerfile
FROM python:3.8-slim

RUN apt-get update && apt-get install -y ufw iptables && \
    apt-get clean

COPY requirements.txt /requirements.txt
RUN pip install --no-cache-dir -r /requirements.txt

COPY src/ /src/

WORKDIR /src


ENTRYPOINT ["kopf", "run", "--standalone", "main.py"]
# kopf run --standalone main.py