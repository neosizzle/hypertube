# /dev/log for hypertube
> sumary TODO

## Requirements

- **Node.js**: v20.10.0 or compatible
- **Python**: v3.11.1 or compatible

## Environment
### Node.js Installation
To install the correct version of Node.js on your system, use **nvm** (Node Version Manager) to manage your Node.js versions.

1. First, install nvm if you haven't already. You can follow the installation instructions from the [official nvm repository](https://github.com/nvm-sh/nvm#installing-and-updating).

2. Once nvm is installed, run the following commands to install and use Node.js v20:

    ```bash
    nvm install 20
    nvm use 20
    ```

### Python Installation with Conda

To install and set up Python 3.11.1 (or compatible) using **Conda**, follow these steps:

1. **Install Conda**: If you don't have Conda installed, you can install it by downloading the [Miniconda](https://docs.conda.io/en/latest/miniconda.html) or [Anaconda](https://www.anaconda.com/products/distribution) distribution, which includes Conda.

2. **Create a new Conda environment** with Python 3.11.1:

    ```bash
    conda create -n env python=3.11.1
    ```

    Replace `env` with the name you wish to give to your environment.

3. **Activate the environment**:

    ```bash
    conda activate env
    ```

4. To confirm that the correct version of Python is installed, run:

    ```bash
    python --version
    ```

    This should display Python 3.11.1 (or a compatible version, depending on what you installed).

## Instructions
### 1. Credentials setup

To make sure the required credentials are in place

```bash
cp .env.example .env
```

---

### 2. Frontend Setup

To get the frontend up and running, follow these steps:

1. **Navigate to the frontend directory**:

    ```bash
    cd frontend
    ```

2. **Install the necessary dependencies** and start the development server:

    ```bash
    npm install && npm run dev
    ```

   - `npm install` will install all required dependencies from the `package.json` file.
   - `npm run dev` will start the development server (make sure you have the necessary environment variables and configurations set).

   The frontend should now be available at `http://localhost:3000` (or another port depending on your configuration).

---
### 3. Backend Setup
To set up the backend, follow these steps:

1. **Navigate to the backend directory**:

    ```bash
    cd backend
    ```

2. **Install the required Python dependencies**:

    If you're using a virtual environment (recommended):

    ```bash
    pip install -r ../requirements.txt
    ```

   This will install all necessary packages listed in `requirements.txt`.

3. **Run the backend server**:

    ```bash
    python manage.py migrate # run table migrations
    python manage.py createsuperuser # create super user, needed for admin access
    python manage.py runserver
    ```

    This will start the Django development server. By default, the admin page will be available at `http://127.0.0.1:8000/admin`.

    - If you're using a different configuration (e.g., Docker or a custom port), be sure to adjust the command accordingly.
