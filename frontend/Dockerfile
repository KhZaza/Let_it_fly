FROM node:alpine
RUN mkdir /app
WORKDIR /app
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
#Install dependencies
RUN npm install
#Copy app's source code inside the Docker image
RUN npm install -g serve
COPY . .
RUN npm run build
EXPOSE 3000
ENTRYPOINT ["serve", "-s", "build", "--cors", "-p", "3000"]