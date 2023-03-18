FROM node:18.15.0-alpine3.17 AS build

WORKDIR /app

ADD . /app

RUN npm install


FROM alpine:3.17.2

RUN apk add --update nodejs

WORKDIR /app

COPY --from=build /app /app

EXPOSE 3000

ENTRYPOINT [ "./docker-entrypoint.sh" ]
