# Learnly LMS Setup Guide

This project has a separate backend and frontend. Follow these steps in order to install dependencies, start both apps, and run the system locally.

## 1) Prerequisites

Make sure the following are installed on your machine:

- Node.js 18 or newer
- npm
- A terminal such as zsh, bash, or PowerShell

To check:

```bash
node -v
npm -v
```

If Node.js is not installed, install it from https://nodejs.org/ and restart your terminal afterward.

---

## 2) Open the project folder

From your terminal:

```bash
cd "/Users/yeshaparwani/Documents/Projects:Learn /LMS"
```

---

## 3) Install root dependencies

The root project includes a few convenience scripts and dependency aliases. Install the root dependencies first:

```bash
npm install
```

---

## 4) Install backend dependencies

The backend is in the `Backend` folder:

```bash
npm --prefix Backend install
```

This installs Express and other backend dependencies required by the API.

---

## 5) Install frontend dependencies

The frontend is in the `Frontend` folder:

```bash
npm --prefix Frontend install
```

This installs React, Vite, and related frontend tooling.

---

## 6) Optional: set the frontend API base URL

The backend runs on port `5000` by default. If you want to explicitly set the frontend API URL before starting Vite, use:

```bash
export VITE_API_URL=http://localhost:5000
```

On Windows PowerShell:

```powershell
$env:VITE_API_URL="http://localhost:5000"
```

If this variable is not set, the frontend defaults to `http://localhost:5000`.

---

## 7) Start the backend

From the project root, run:

```bash
npm run start:backend
```

Or directly from the backend folder:

```bash
cd Backend
npm start
```

The backend will start and print a message like:

```bash
Learnly API running on http://localhost:5000
```

Keep this terminal open while the app is running.

---

## 8) Start the frontend

Open a second terminal, stay in the project root, and run:

```bash
npm run dev
```

This starts the Vite frontend development server. The terminal will print a local URL, generally:

```bash
http://localhost:5173
```

Open that URL in your browser.

---

## 9) Run the app together

The full local workflow is:

1. Start backend in terminal 1
2. Start frontend in terminal 2
3. Open browser at `http://localhost:5173`

---

## 10) Useful project commands

From the project root:

```bash
npm run dev
npm run start:backend
npm start
npm run build
npm run lint
```

What they do:

- `npm run dev` — starts the Vite frontend
- `npm run start:backend` — starts the Express backend
- `npm start` — alias for backend startup
- `npm run build` — builds the frontend for production
- `npm run lint` — runs ESLint checks on the frontend

---

## 11) Important notes

- The backend stores course and user data in memory only.
- Restarting the backend will reset in-memory data.
- This is meant for local development/demo work, not production.
- The app expects the backend to be available at `http://localhost:5000`.

---

## 12) Troubleshooting

### Backend port already in use

If port 5000 is already occupied, stop the existing process or start the backend with a different port:

```bash
PORT=6000 npm --prefix Backend start
```

Then set the frontend URL accordingly:

```bash
export VITE_API_URL=http://localhost:6000
```

### Dependencies not installed

Run the package install commands again:

```bash
npm install
npm --prefix Backend install
npm --prefix Frontend install
```

### Frontend cannot connect to backend

Make sure the backend is still running and the URL matches the backend port.

Check the backend health endpoint:

```bash
curl http://localhost:5000/api/health
```

You should receive a JSON response with service status.

---

## 13) Default local URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

---

## 14) Quick start summary

If you just want the fastest setup, run:

```bash
cd "LMS"
npm install
npm --prefix Backend install
npm --prefix Frontend install
npm run start:backend
```

Then in a second terminal:

```bash
cd "/Users/yeshaparwani/Documents/Projects:Learn /LMS"
npm run dev
```

Open `http://localhost:5173` in your browser.
