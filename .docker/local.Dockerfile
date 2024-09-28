FROM node:20-bookworm

RUN set -exu && \
    apt update && \
    apt upgrade -y install -y ufw iptables && \
    apt clean


ENV NODE_OPTIONS="--enable-source-maps -r tsconfig-paths/register"