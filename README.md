# Authentication Service

## Overview

Authentication service for Papdaew. This service handles user authentication, authorization, and token management.

## Table of Contents

- [Authentication Service](#authentication-service)
  - [Overview](#overview)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)

## Features

- User authentication (login/signup) (in-progress)
- JWT token management (planned)
- Role-based access control (planned)
- Password reset functionality (planned)
- Session management (planned)
- OAuth integration (planned)

## Tech Stack

- Node.js

## Project Structure

```
services/papdaew-auth/
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── config.js
│   ├── server.js
│   └── app.js
├── tests/
├── .editorconfig
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

3. **Database Setup**

```bash
# Start PostgreSQL (if using Docker)
docker-compose up -d postgres

# Run database migrations
npx prisma migrate dev
```

4. Run the service:

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```
