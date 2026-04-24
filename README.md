# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## Authentication

### How it works
The system uses JWT (JSON Web Tokens) for authentication. On login, the
backend returns a token that the frontend stores in localStorage and sends
with every protected API request.

### Login endpoint
POST /api/auth/login

Request body:
{
  "email": "admin@pateros.gov.ph",
  "password": "admin123"
}

Success response (200):
{
  "message": "Login successful.",
  "token": "<jwt>",
  "user": {
    "user_id": 1,
    "full_name": "Admin User",
    "role": "Admin",
    "barangay_id": null
  }
}

### Using the token in API calls
All protected routes require an Authorization header:
Authorization: Bearer <token>

The frontend handles this automatically via src/api/api.js.
Never call fetch() directly — always use apiFetch() from that file.

### Role scoping
- Admin: barangay_id is null — can access all barangays
- Staff: barangay_id is set — can only access their assigned barangay

### Creating the first admin account
Since there is no registration endpoint, insert directly into MySQL for now:

1. Generate a bcrypt hash in the backend folder:
   node -e "const b = require('bcrypt'); b.hash('yourpassword', 10).then(h => console.log(h));"

2. Insert into the database:
   INSERT INTO users (full_name, email, password_hash, role, barangay_id)
   VALUES ('Admin User', 'admin@pateros.gov.ph', 'PASTE_HASH_HERE', 'Admin', NULL);