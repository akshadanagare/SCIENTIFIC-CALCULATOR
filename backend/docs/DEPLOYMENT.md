# MathCorner Cloud Deployment Guide

This guide explains how to connect your deployed frontend on GitHub Pages (`https://akshadanagare.github.io/SCIENTIFIC-CALCULATOR/`) to a cloud PostgreSQL database.

---

## 1-Click Deployment with Render (Free)

This repository includes a `render.yaml` blueprint that automatically creates:
1. A **PostgreSQL Database** named `calculation`.
2. A **Fastify API Web Service** connecting to that database.

### Steps:
1. Go to [Render.com](https://render.com) and sign in with your GitHub account (`akshadanagare`).
2. Click **New +** ➔ **Blueprint**.
3. Connect your repository: `akshadanagare/SCIENTIFIC-CALCULATOR`.
4. Render will detect `render.yaml` and create:
   - Database: `mathcorner-postgres`
   - Web Service: `mathcorner-api`
5. Click **Apply**.
6. Once deployed, Render will give you a public URL, for example:
   `https://mathcorner-api.onrender.com`

---

## Connect GitHub Pages to the Cloud API

1. Go to your GitHub repository:
   [https://github.com/akshadanagare/SCIENTIFIC-CALCULATOR/settings/variables/actions](https://github.com/akshadanagare/SCIENTIFIC-CALCULATOR/settings/variables/actions)
2. Under **Repository variables**, click **New repository variable**:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://mathcorner-api.onrender.com` (your Render URL)
3. Click **Add variable**.
4. Re-run your GitHub Actions workflow:
   - Go to **Actions** ➔ **Deploy to GitHub Pages** ➔ **Run workflow**.

---

## Verification
Open your live calculator:
`https://akshadanagare.github.io/SCIENTIFIC-CALCULATOR/`
- Every calculation performed will now be sent to your cloud Fastify API and saved in your cloud PostgreSQL `calculation` database!
