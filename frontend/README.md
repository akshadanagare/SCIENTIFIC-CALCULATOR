# MathCorner frontend

React 18 + Vite. It needs the backend (`../backend`) for history and saved settings.
See the README in the parent folder for how to run everything (`npm run setup`, then `npm run dev`).

Only this folder:

```bash
npm install
npm run dev      # http://localhost:5173  (forwards /api to http://localhost:3001)
npm run build    # production build in dist/
```

When the website and the API are on different addresses (after deploying), set `VITE_API_URL` (see `.env.example`).
