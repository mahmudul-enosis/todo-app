# Todo application

A small full-stack todo application with an Angular frontend, an ASP.NET Core
minimal API, and MySQL persistence. The development environment is defined as a
VS Code devcontainer and runs on Docker Compose.

## Stack

- Angular 22
- Node.js 24
- ASP.NET Core 10 minimal API
- Entity Framework Core with MySQL
- MySQL 8.4
- Docker Compose and VS Code Dev Containers

## Project structure

```text
.
|-- .devcontainer/
|   |-- devcontainer.json     # Editor, runtimes, ports, and startup commands
|   `-- docker-compose.yml    # Development container and MySQL services
|-- TodoApi/                  # ASP.NET Core API and database model
`-- TodoClient/               # Angular application
```

## Start with the devcontainer

### Prerequisites

- Docker Engine or Docker Desktop
- Visual Studio Code
- The VS Code Dev Containers extension

Open this repository in VS Code and run **Dev Containers: Reopen in Container**
from the command palette. For the first run, or after changing the container
configuration, run **Dev Containers: Rebuild and Reopen in Container**.

The container will automatically:

1. Start MySQL and wait until it is healthy.
2. Restore the .NET packages and install the Angular packages.
3. Start the API with `dotnet watch`.
4. Start the Angular development server.

The initial container build takes longer because it downloads the images,
installs Node.js, and installs project dependencies. Normal container reopens
reuse those resources.

## Development URLs

| Service | URL |
| --- | --- |
| Angular frontend | <http://localhost:4200> |
| Todo API | <http://localhost:5154/todos> |
| OpenAPI document | <http://localhost:5154/openapi/v1.json> |
| MySQL | `localhost:3306` |

The Angular development server proxies `/api/*` to the API on port `5154`.

## API endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/todos` | List all tasks |
| `GET` | `/todos/{id}` | Get one task |
| `POST` | `/todos` | Create a task |
| `PUT` | `/todos/{id}` | Update a task |
| `DELETE` | `/todos/{id}` | Delete a task |

Example create request:

```bash
curl -X POST http://localhost:5154/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Review the API","isComplete":false}'
```

## MySQL access

The development database uses these credentials:

```text
Host: localhost
Port: 3306
Database: todo_api
Username: todo
Password: todo_password
```

Connect through the running MySQL container:

```bash
docker exec -it demo-api_devcontainer-mysql-1 \
  mysql -utodo -ptodo_password todo_api
```

Useful SQL commands:

```sql
SHOW TABLES;
DESCRIBE Todos;
SELECT * FROM Todos;
```

The database is stored in the `mysql-data` Docker volume and survives container
restarts. These credentials are intended only for local development.

## Common commands

Run these commands from the repository root inside the devcontainer. The API and
frontend normally start automatically, so manual start commands are only needed
after stopping their existing terminal tasks.

```bash
# Start the API manually
dotnet watch --project TodoApi/TodoApi.csproj run --urls http://0.0.0.0:5154

# Start the Angular frontend manually
npm start --prefix TodoClient -- --host 0.0.0.0 --port 4200

# Build the API
dotnet build TodoApi/TodoApi.csproj

# Build the Angular application
npm run build --prefix TodoClient

# Run Angular tests once
npm test --prefix TodoClient -- --watch=false
```

## Configuration

The devcontainer provides the API connection string through the
`ConnectionStrings__DefaultConnection` environment variable. Inside Docker, the
API connects to MySQL using the Compose service name `mysql` rather than
`localhost`.

The API creates its database tables on startup when they do not already exist.
Angular CLI analytics are disabled in `TodoClient/angular.json` so unattended
devcontainer startup cannot pause at the first-run analytics prompt.

## Troubleshooting

### Angular is running but port 4200 is unavailable

Check the frontend terminal created by the devcontainer. To restart it:

```bash
pkill -f "ng serve"
npm start --prefix TodoClient -- --host 0.0.0.0 --port 4200
```

### MySQL port 3306 is already in use

Check which Docker container owns the port:

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}'
```

Stop the conflicting local service or container before rebuilding this
devcontainer.

### Dependency changes are not available

Run **Dev Containers: Rebuild and Reopen in Container** after changing
`.devcontainer/devcontainer.json`, the Node.js version, or container features.
