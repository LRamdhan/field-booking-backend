# Use the official Node.js runtime as base image
FROM node:22.18.0

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
# This is done before copying the entire codebase to leverage Docker's layer caching
COPY package*.json ./

# Install dependencies
# Use npm ci for faster, reliable, reproducible builds in production
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Create a directory for logs (optional)
RUN mkdir -p logs

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["node", "/app/src/main.js"]