FROM node:14
#RUN npm install -g npm@latest

COPY . /build
WORKDIR /build/client

ENV REACT_APP_USERDATA_API ''
ENV DEPLOYMENT_BUCKET ''

RUN rm -f .env.local
RUN npm ci --legacy-peer-deps
#RUN npx update-browserslist-db@latest
RUN npm run build

ENTRYPOINT ["/bin/node", "deploy.js"]