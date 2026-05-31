# DSA Progress Tracker

A complete React + Node website generated from your company-wise DSA dataset.

## What is included

- **1,755 globally unique DSA questions** extracted from the provided ZIP.
- **Node/Express backend** with REST APIs for questions, filters, analytics, progress, notes, bookmarks, CSV export, and backups.
- **React frontend** with dashboard, search, filters, progress table, company/topic views, review queue, favorites, notes, and clickable problem links.
- **Persistent backend progress storage** in `server/data/progress.json`.
- No duplicate question rows in the UI data.

## Quick start

```bash
cd dsa-progress-tracker
npm install
npm run dev
```

Then open the React app at the Vite URL shown in the terminal, usually `http://localhost:5173`.
The backend runs on `http://localhost:4000` by default.

## Production-style run

```bash
cd dsa-progress-tracker
npm install
npm run start --workspace server
```

For a real deployment, build the frontend with:

```bash
npm run build --workspace client
```

Then host `client/dist` on any static host and point `VITE_API_BASE_URL` to your backend URL.

## Backend API highlights

- `GET /api/health`
- `GET /api/meta`
- `GET /api/questions`
- `GET /api/questions/:id`
- `GET /api/stats`
- `GET /api/progress`
- `PUT /api/progress/:id`
- `POST /api/progress/bulk`
- `POST /api/progress/reset`
- `GET /api/export/progress.csv`
- `GET /api/export/progress.json`
- `POST /api/import/progress`

## Dataset audit

- Source ZIP: `Leetcode Company Wise Problems - Updated as of March 2025 - Krishan Kumar.zip`
- CSV sheets scanned: `1225`
- Company folders checked: `245`
- Source rows scanned: `16543`
- Unique questions kept: `1755`
- Duplicate source rows removed: `14788`
- Missing links: `0`
- Parser errors: `0`

## Progress statuses

- Not Started
- In Progress
- Solved
- Revision
- Skipped

You can also save notes, mark favorites, assign priority, add last/next review dates, and bulk update selected rows.
