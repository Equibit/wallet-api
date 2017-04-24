FROM node:7.9

RUN mkdir -p /home/www/wallet-api
WORKDIR /home/www/wallet-api

COPY package.json .
RUN yarn

COPY . /home/www/wallet-api

EXPOSE 8000
CMD [ "npm", "start" ]