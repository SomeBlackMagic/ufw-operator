FROM node:20-bookworm

RUN set -exu && \
    apt update && \
    apt upgrade -y && \
    apt install -y ufw iptables && \
    apt clean


COPY .docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
RUN mkdir /docker-entrypoint.d

ENV NPM_CACHE_LOCATION=$HOME/.npm

WORKDIR /app

COPY package.json /app
COPY  package-lock.json /app

RUN --mount=type=cache,target=$NPM_CACHE_LOCATION,uid=0,gid=0 npm install

COPY . /app

ARG VERSION="0.0.0"
ARG REVISION="local"

ENV APP_VERSION="$VERSION-$REVISION"
ENV NODE_OPTIONS="--enable-source-maps -r tsconfig-paths/register"
CMD ["node", "/app/node_modules/.bin/ts-node", "public/index.ts"]
