FROM node
WORKDIR /home/administrator/nodeapp/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "app.js"]