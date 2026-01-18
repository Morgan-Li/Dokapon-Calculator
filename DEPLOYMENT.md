# Deployment Guide - Netlify

This guide walks through deploying the Dokapon Calculator to Netlify (100% free).

## Prerequisites

- GitHub account
- Netlify account (free - sign up at [netlify.com](https://netlify.com))

## Step 1: Push to GitHub

First, create a new repository on GitHub, then:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Dokapon Calculator MVP setup"

# Add your GitHub repo as remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/dokapon-calculator.git

# Push to GitHub
git push -u origin main
```

## Step 2: Connect to Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub account
5. Select your `dokapon-calculator` repository

## Step 3: Configure Build Settings

Netlify should auto-detect settings from `netlify.toml`, but verify:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Branch to deploy**: `main`

Click **"Deploy site"**

## Step 4: Wait for Deployment

The first deploy takes 1-2 minutes. You'll see:

- Installing dependencies
- Running build command
- Publishing to CDN

## Step 5: Your Site is Live!

Once deployed, you'll get a URL like:
```
https://random-name-123456.netlify.app
```

### Optional: Custom Domain

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain (or use free subdomain)
4. Follow DNS configuration instructions

### Optional: Change Site Name

1. Go to **Site settings** → **General** → **Site details**
2. Click **"Change site name"**
3. Enter: `dokapon-calculator` (if available)
4. Your URL becomes: `https://dokapon-calculator.netlify.app`

## Automatic Deployments

Now every time you push to `main` branch, Netlify will automatically:
1. Pull latest code
2. Run `npm run build`
3. Deploy new version
4. Rollback if build fails

## Deploy Previews

For pull requests:
- Netlify creates preview deployments
- Test changes before merging to main
- Each PR gets unique URL

## Environment Variables (Future)

If you need environment variables later:

1. Go to **Site settings** → **Environment variables**
2. Add variables (e.g., API keys)
3. They'll be available during build

## Monitoring

Check deployment status:
- **Deploys** tab shows all deployments
- **Functions** tab (if you add serverless functions later)
- **Analytics** tab (upgrade to see traffic)

## Troubleshooting

### Build Fails

Check the build log in Netlify dashboard:
- Click failed deployment → **View details**
- Look for error messages
- Common issues:
  - Missing dependencies
  - TypeScript errors
  - Out of memory (increase in site settings)

### Site Not Updating

- Check **Deploys** tab for deployment status
- Clear browser cache
- Try incognito/private window

### 404 Errors

The `netlify.toml` file includes redirects for React Router:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This is already configured!

## Cost

**Free tier includes**:
- 100GB bandwidth/month
- 300 build minutes/month
- Automatic HTTPS
- CDN hosting
- Continuous deployment

This is more than enough for MVP and beyond.

## Next Steps

Once deployed:
1. Share the URL for testing
2. Monitor build times (optimize if needed)
3. Set up custom domain (optional)
4. Enable deploy notifications (Slack, email, etc.)

## Useful Commands

```bash
# Check site status
npx netlify-cli status

# Deploy manually (alternative method)
npm run build
npx netlify-cli deploy --prod

# Open site in browser
npx netlify-cli open:site
```

---

Your Dokapon Calculator is now live and ready for the world!
