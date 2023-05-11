# CACAO-API

Node.JS Express app that synches and supplies data parsed from the ODK forms.

## Table of Contents

-   [Getting Started](#getting-started)
    -   [Prerequisites](#prerequisites)
    -   [Installation](#installation)
-   [Usage](#usage)
-   [Development](#development)
    -   [Linting and Formatting](#linting-and-formatting)
    -   [Database Setup](#database-setup)
-   [Deployment](#deployment)
-   [Built With](#built-with)
-   [License](#license)

## Getting Started

These instructions will get your project up and running on your local machine for development and testing purposes.

### Prerequisites

-   Node.js (version 16.17.0)
-   Docker (optional)

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com//cacao-api.git
    ```

2. Navigate to the project directory

    ```bash
    cd cacao-api
    ```

3. Install dependencies:

    ```bash
    yarn install
    ```

## Usage

Describe how to use/run the application or provide examples of basic usage.

## Local Development

### Linting and Formatting

This project uses ESLint and Prettier for typescript linting and code formatting. You can find the formatting settings in the `.prettierrc` file and the typescript config at `tsconfig.json`.

Eslint rules can be found at `.eslintrc.json`.

### Database Setup

This project utilizes Prisma as an ORM for database operations wtih Postgres. Follow these steps to set up the database:

1. Copy the .env.example file and rename it to .env. Fill in the required environment variables.

2. Run database migrations:

    ```bash
    yarn prisma migrate dev
    ```

### Running with Docker

This requires you to have docker installed. Then, you can start the project:

```bash
yarn docker
```

NOTE: This will also build the containers.

NOTE: Initial setups may cause errors, as migrations don't get automatically applied during the container build or start process.

To apply migrations in the docker context, run:

```bash
yarn docker:db:migrate
```

## Deployment

This section should provide instructions on how to deploy the project to a production environment.

## Built With

-   [Node.js](https://nodejs.org/en) - JavaScript runtime
-   [Express](https://expressjs.com/) - Web framework
-   [TypeScript](https://www.typescriptlang.org/) - Programming language
-   [ESLint](https://eslint.org/) - Code linter
-   [Prettier](https://prettier.io/) - Code formatter
-   [Prisma](https://www.prisma.io/) - Database ORM
-   [Docker](https://www.docker.com/) - Containerization platform
