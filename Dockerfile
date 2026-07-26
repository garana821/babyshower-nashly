# Use a lightweight Node.js LTS image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the API package description first to take advantage of Docker cache layering
COPY api/package.json ./api/

# Install only production dependencies for the API
RUN cd api && npm install --only=production

# Copy the rest of the application files
COPY . .

# Expose the default application port
EXPOSE 5000

# Set environment variables
ENV PORT=5000
ENV NODE_ENV=production
ENV ADMIN_USER=""
ENV ADMIN_PASSWORD=""

# Run the API server
CMD [ "node", "api/server.js" ]
