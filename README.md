# screenshothis

**screenshothis** is a modern, full-stack application designed to capture and manage screenshots with ease. Built with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), it leverages a robust and type-safe TypeScript-centric technology stack.

## ✨ Features

- **TypeScript**: End-to-end type safety for a better developer experience and fewer runtime errors.
- **Monorepo Architecture**: Managed with `turbo` for optimized build and development workflows.
- **Frontend (TanStack Start & React)**:
    - SSR (Server-Side Rendering) capabilities via TanStack Start.
    - Modern UI built with React and TailwindCSS.
    - Reusable and accessible UI components from `alignui`.
    - Client-side routing with TanStack Router.
- **Backend (Hono & tRPC)**:
    - Lightweight and performant server built with Hono.
    - End-to-end type-safe APIs using tRPC, ensuring seamless communication between frontend and backend.
- **Database (PostgreSQL & Drizzle ORM)**:
    - Robust and scalable PostgreSQL database.
    - TypeScript-first ORM (Drizzle) for intuitive and type-safe database interactions.
- **Authentication**: Secure email & password authentication provided by Better Auth.
- **Development Tools**:
    - **pnpm**: Fast, disk space efficient package manager.
    - **Biome**: Integrated linter and formatter for consistent code quality.
    - **Husky**: Git hooks for automated checks.

## 🚀 Getting Started

Follow these steps to get the project up and running on your local machine.

### Prerequisites

- [pnpm](https://pnpm.io/) (v8.0 or higher)
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/)
- A running PostgreSQL instance

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/screenshothis.git
    cd screenshothis
    ```

2.  **Install dependencies:**
    This project uses pnpm for package management.
    ```bash
    pnpm install
    ```

## ⚙️ Configuration

### Environment Variables

This repository follows the [Turborepo best-practice](https://turborepo.com/docs/crafting-your-repository/using-environment-variables#best-practices) of keeping environment files **next to the packages that consume them**. You will therefore find separate `.env` / `.env.example` files in each application folder.

#### 1. Backend – `apps/server`

Environment variables for the API server (database, Redis, MinIO, authentication, etc.).

1.  Navigate to the server directory and copy the example file:
    ```bash
    cd apps/server
    cp .env.example .env
    ```
2.  Edit `apps/server/.env` and update the values to match your local setup, e.g.:
    ```env
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
    BETTER_AUTH_SECRET="your_strong_auth_secret_here"
    DEFAULT_API_KEY_PREFIX="ss_test_"
    # …and any optional providers (Google OAuth, Polar, AWS/MinIO, etc.)
    ```

#### 2. Frontend – `apps/web`

The web application only needs a handful of variables. Copy and adjust its example as well:

```bash
cd apps/web
cp .env.example .env
```

Update `apps/web/.env` to point to your running server and any optional OAuth keys:

```env
# Server the frontend should call
VITE_SERVER_URL="http://localhost:3000"

# Optional Google OAuth client for Better Auth
VITE_GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"

# Polar integration (optional)
POLAR_ACCESS_TOKEN="your_polar_access_token"
POLAR_ENVIRONMENT="sandbox"
```

> **Tip**: Keep the `.env.example` files up-to-date whenever you add a new variable so other contributors know what is required.

## 🗄️ Database Setup

This project uses PostgreSQL with Drizzle ORM.

1.  **Ensure PostgreSQL is Running**: Make sure you have a PostgreSQL server running and accessible.
2.  **Configure Connection**: Update your `apps/server/.env` file with your PostgreSQL connection details (as described in the Environment Variables section).
3.  **Apply Schema (Push Migrations)**:
    This command introspects your Drizzle schema and applies the necessary changes to your database.
    ```bash
    pnpm run db:push
    ```
4.  **(Optional) Drizzle Studio**:
    To view and manage your database with a UI, you can use Drizzle Studio:
    ```bash
    pnpm run db:studio
    ```

## 🗂️ File Storage Setup (MinIO)

This project uses MinIO as an S3-compatible object storage solution for local development. The MinIO service is configured in the `docker-compose.yml` file in the root directory.

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose

### Setup Instructions

1.  **Start MinIO Service:**
    Run the following command from the root directory to start the MinIO container:
    ```bash
    docker-compose up -d
    ```

    **Note**: MinIO data will be persisted in a Docker volume named `minio_data`.

2.  **Configure Environment Variables:**
    Add the following MinIO configuration to your `apps/server/.env` file:
    ```env
    # MinIO Configuration (for local development)
    AWS_ACCESS_KEY_ID=screenshothis-access-key
    AWS_SECRET_ACCESS_KEY=screenshothis-secret-key
    AWS_REGION=us-east-1
    AWS_BUCKET=screenshothis-bucket
    AWS_URL=http://localhost:9000
    AWS_ENDPOINT=http://localhost:9000
    AWS_USE_PATH_STYLE_ENDPOINT=true
    ```

3.  **Access MinIO Console:**
    - Open your browser and navigate to [http://localhost:9001](http://localhost:9001)
    - Login with:
      - **Username**: `screenshothis-access-key`
      - **Password**: `screenshothis-secret-key`

4.  **Create Storage Bucket:**
    - In the MinIO console, click "Create Bucket"
    - Enter bucket name: `screenshothis-bucket` (or match your `AWS_BUCKET` environment variable)
    - Click "Create Bucket"

5.  **Verify Setup:**
    - MinIO API is available at: [http://localhost:9000](http://localhost:9000)
    - MinIO Console is available at: [http://localhost:9001](http://localhost:9001)

### Managing MinIO

- **Stop MinIO**: `docker-compose down`
- **View MinIO logs**: `docker-compose logs minio`
- **Restart MinIO**: `docker-compose restart minio`

## 🧑‍💻 Local Development

Follow these steps to spin up the entire stack locally:

1. **Configure environment variables**
   Copy every `.env.example` to `.env` inside the same folder and fill in the values needed for your machine (see the Environment Variables section).

2. **Start supporting services**
   Run the containers defined in `docker-compose.yml` (PostgreSQL, Redis, and MinIO):

   ```bash
   docker-compose up -d
   ```

3. **Start the applications**
   From the repository root, run:

   ```bash
   pnpm run dev
   ```

   This starts both `apps/server` (Hono API) and `apps/web` (React/TanStack Start) with hot-reloading.

4. **Open your browser**
   • Web UI: [http://localhost:3001](http://localhost:3001)
   • API: [http://localhost:3000](http://localhost:3000)

## ▶️ Running the Application

Once the dependencies are installed and the database is configured:

1.  **Start the development servers:**
    This command will start both the web frontend and the Hono backend API concurrently.
    ```bash
    pnpm run dev
    ```

2.  **Access the applications:**
    -   Web Application: [http://localhost:3001](http://localhost:3001)
    -   API Server: [http://localhost:3000](http://localhost:3000) (typically accessed by the web app)

## 📂 Project Structure

The project is organized as a monorepo using `turbo`.

```
screenshothis/
├── .husky/            # Git hooks
├── .turbo/            # Turborepo cache and logs
├── apps/
│   ├── server/        # Backend API (Hono, tRPC, Drizzle)
│   │   ├── src/
│   │   │   ├── actions/     # Server-side actions/logic
│   │   │   ├── common/      # Shared utilities for the server
│   │   │   ├── db/          # Drizzle ORM setup, schema, migrations
│   │   │   │   ├── migrations/ # Database migration files
│   │   │   │   └── schema/     # Drizzle schema definitions
│   │   │   ├── lib/         # Core libraries and helpers for the server
│   │   │   ├── routers/     # tRPC routers
│   │   │   ├── routes/      # Hono routes (including tRPC handler)
│   │   │   └── utils/       # Server-specific utility functions
│   │   ├── .env.example   # Example environment variables
│   │   └── package.json
│   └── web/           # Frontend application (React, TanStack Start, TailwindCSS)
│       ├── public/        # Static assets
│       ├── src/
│       │   ├── actions/     # Client-side actions (e.g., form submissions)
│       │   ├── components/  # React components (UI, forms, sections)
│       │   ├── content/     # Content collections (e.g., legal pages)
│       │   ├── hooks/       # Custom React hooks
│       │   ├── lib/         # Client-side libraries and helpers (e.g., utils, shadcn)
│       │   ├── routes/      # TanStack Router route definitions
│       │   ├── types/       # TypeScript type definitions for the web app
│       │   └── utils/       # Client-specific utility functions
│       └── package.json
├── packages/
│   ├── common/        # Shared code/types between apps (e.g., validation logic)
│   │   └── src/
│   ├── id/            # Utilities for generating IDs (e.g., KSUID)
│   │   └── src/
│   └── schemas/       # Shared Zod schemas for validation (tRPC inputs, etc.)
│       └── src/
├── .gitignore
├── biome.json         # Biome (linter/formatter) configuration
├── bun.lockb          # Bun lockfile
├── LICENSE            # Project License
├── package.json       # Root package.json for the monorepo
├── README.md
└── turbo.json         # Turborepo configuration
```

## 📜 Available Scripts

The following scripts can be run from the root of the monorepo:

-   `pnpm install`: Install all dependencies for the monorepo.
-   `pnpm run dev`: Start all applications (web and server) in development mode.
-   `pnpm run build`: Build all applications for production.
-   `pnpm run dev:web`: Start only the web (frontend) application in development mode.
-   `pnpm run dev:server`: Start only the server (backend) application in development mode.
-   `pnpm run check-types`: Run TypeScript type checking across all packages and applications.
-   `pnpm run db:push`: Apply Drizzle schema changes to the configured database.
-   `pnpm run db:studio`: Open Drizzle Studio to view and manage the database.
-   `pnpm run check`: Run Biome linting and formatting checks across the codebase.
-   `pnpm run format`: Apply Biome formatting to the codebase.
-   `pnpm run lint`: Run Biome linting checks.
-   `pnpm run lint:fix`: Run Biome linting and attempt to automatically fix issues.

*(Note: Individual apps within `apps/*` and packages within `packages/*` may have their own specific scripts defined in their respective `package.json` files.)*

## 🛠️ Linting and Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting.

-   To check for issues: `pnpm run check`
-   To format code: `pnpm run format`
-   To lint code: `pnpm run lint`
-   To lint and attempt to fix issues: `pnpm run lint:fix`

Husky is configured to run checks before commits.

## ☁️ Deployment

TBD

### Troubleshooting

- **Port conflicts**: If port 9000 or 9001 is already in use, update the ports in `docker-compose.yml` and corresponding environment variables.
- **Connection issues**: Ensure Docker is running and the MinIO container is healthy: `docker-compose ps`

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute, please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes and commit them (`git commit -m 'Add some feature'`).
4.  Push to the branch (`git push origin feature/your-feature-name`).
5.  Open a Pull Request.

Please ensure your code adheres to the linting and formatting guidelines (`pnpm run check`).

## 📄 License

This project is licensed under the [AGPL-3.0](./LICENSE).

## Security & Rate Limits

- **Header size limit**: Each request's `headers` parameter is capped at 8 KB (8192 characters).
- **Cookie size limit**: The `cookies` parameter is capped at 4 KB (4096 characters).
- **Rate limiting**: Screenshot generation is limited via `requestLimits` (see server schema) and enforced per-user.
- **CSP bypass auditing**: Every time `bypass_csp=true` is used, the event is audit-logged server-side for review.

These constraints ensure reliable performance and mitigate abuse vectors per RFC 7230 and common security best practices.
