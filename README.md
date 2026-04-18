# fastapi-react-websocket-app :globe_with_meridians:
A simple Web Application built with FastAPI, React and Websocket. This project was created to consolidate my learning in these technologies and gain confidence in using them for more complex software.

## :rocket: Getting started
### Prerequisites
- Git
- Python 3.9+
- Docker (recommended)
- Node.js

### Clone this repo

```bash
git clone https://github.com/GabrielReira/fastapi-react-websocket-app.git
cd fastapi-react-websocket-app
```

---

## :hammer_and_wrench: Running the project

### :whale: Running entire project using Docker Compose
To run both the backend and frontend, use the single command bellow that will build and start all services:
```bash
docker-compose up --build
```

### :computer: Running backend independently
You can also run the backend service separately, either with or without Docker.

#### Running backend with Docker
1. Go to backend folder
```bash
cd backend
```

2. Build and run the Docker image
```bash
docker build -t app-backend-image .
docker run -dp 8000:8000 app-backend-image
```

To run with a Docker volume for persistent data storage:
```bash
docker volume create app-db-volume
docker build -t app-backend-image .
docker run -dp 8000:8000 -v app-db-volume:/app/data app-backend-image
```

#### Running backend without Docker
1. Go to backend folder
```bash
cd backend
```

2. Create a virtual environment
```bash
python -m venv venv
```

3. Activate your virtual environment
```bash
source venv/bin/activate  # for Mac/Linux
venv\Scripts\activate  # for Windows
```

4. Install the required dependencies
```bash
pip install -r requirements.txt
```

5. Start the FastAPI server
```bash
uvicorn main:app --reload
```

---

### :art: Running frontend independently
The frontend can also be run separately, either with Docker or not.

#### Running frontend with Docker
1. Go to frontend folder
```bash
cd frontend
```

2. Build and run the Docker image
```bash
docker build -t app-frontend-image .
docker run -dp 3000:3000 app-frontend-image
```

#### Running frontend without Docker
1. Go to Frontend folder
```bash
cd frontend
```

2. Install dependencies and start the React server
```bash
npm install
npm start
```

---

### :link: How to access the services
- **Backend (FastAPI)**: Your backend app will be running on http://localhost:8000. Take a look at the API documentation at http://localhost:8000/docs.
- **Frontend (React)**: Your frontend app will be running on http://localhost:3000.

---

<p align="center">
    <strong>Feel free to connect with me on <a href="https://www.linkedin.com/in/gabrielreira/">LinkedIn</a></strong>
</p>
