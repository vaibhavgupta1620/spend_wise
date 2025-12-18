SpendWise Fullstack (Frontend + Backend)
=======================================

Structure:
  /frontend    - your existing Vite + React + TypeScript frontend (from your project)
  /backend     - Node + Express + Mongoose backend (created to match frontend fields)

Quick start (run separately):
  1) Backend:
     cd backend
     cp .env.example .env
     # edit .env and set MONGODB_URI to your MongoDB connection string
     npm install
     npm run dev

  2) Frontend:
     cd frontend
     cp .env.example .env
     # edit .env if you need to change VITE_API_BASE (defaults to http://localhost:5000/api)
     npm install
     npm run dev

Notes:
  - The frontend includes a new file src/services/api.ts which your components can import to call the backend.
  - The backend exposes CRUD endpoints at /api/expenses
  - The frontend may expect certain field names; the API maps MongoDB's _id to id in returned objects.