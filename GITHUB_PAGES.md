# GitHub Pages Deployment

This site is automatically deployed to GitHub Pages using GitHub Actions.

## Live Site
The application is available at: https://shamlaw.github.io/new-record/

## How it Works
- When changes are pushed to the `main` branch, GitHub Actions automatically builds and deploys the site
- The deployment process copies static files (HTML, CSS, JS) to GitHub Pages
- The application works with mock data for demonstration purposes
- PHP endpoints are not available on GitHub Pages, but the app gracefully falls back to mock data

## Making Updates
1. Push changes to the `main` branch
2. GitHub Actions will automatically build and deploy the updated site
3. Changes will be live within a few minutes

## Local Development
To test locally:
```bash
# Serve the site locally
python3 -m http.server 8000

# Open http://localhost:8000 in your browser
```