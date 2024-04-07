FROM node:14

COPY . /build
WORKDIR /build/client

ENV REACT_APP_USERDATA_API ''
ENV DEPLOYMENT_BUCKET ''

RUN rm -f .env.local
RUN npm ci --legacy-peer-deps
RUN npm run build

ENTRYPOINT ["/bin/node", "deploy.js"]