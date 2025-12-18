# Casorio BruFu

A beautiful, romantic wedding website built with Astro, featuring guest authentication, RSVP management, gift registry with payment QR codes, and more.

**Live site:** https://fuinha11.github.io/casorio-brufu/

## Features

- **Guest Authentication** - Secure access with unique guest codes
- **RSVP System** - Guests can confirm attendance with dietary restrictions
- **Gift Registry** - Creative gift ideas with automatic payment QR code generation
- **Music Suggestions** - Guests can suggest songs for the party
- **Event Details** - Ceremony info, venue location, and directions
- **Photo Gallery** - Showcase couple photos
- **Countdown Timer** - Live countdown to the wedding day
- **Responsive Design** - Works on all devices

## Tech Stack

- **Framework:** [Astro](https://astro.build/)
- **Styling:** CSS with custom properties (design tokens)
- **Backend:** Google Apps Script + Google Sheets
- **File Storage:** Google Drive
- **Hosting:** GitHub Pages
- **CI/CD:** GitHub Actions

## Project Structure

```
casorio-brufu/
├── src/
│   ├── components/     # Reusable Astro components
│   ├── layouts/        # Page layouts (protected & public)
│   ├── pages/          # Site pages
│   ├── scripts/        # TypeScript utilities (auth, etc.)
│   └── styles/         # Global CSS and theme
├── public/             # Static assets (images, fonts)
├── google/             # Google Apps Script source
└── .github/workflows/  # GitHub Actions for deployment
```

## Setup Guide

### Prerequisites

- Node.js 20+
- npm
- A Google account
- A GitHub account

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/casorio-brufu.git
cd casorio-brufu
npm install
```

### 2. Set Up Google Sheets

1. Create a new Google Sheet
2. Create the following tabs:
   - `Guests` - Columns: `Code | Name | IsPlusOne`
   - `RSVP` - Columns: `GuestCode | GuestName | Attending | Dietary | ConfirmedBy | FirstConfirmed | LastUpdated`
   - `Presentes` - Columns: `GuestCode | GuestName | Gift | Value | Message | Receipt | Date`
   - `Musicas` - Columns: `GuestCode | GuestName | Song | Artist | Why | Date`
   - `Leilao` - Columns: `GuestCode | GuestName | Item | Amount | Date`

3. Add guest codes to the `Guests` tab

### 3. Set Up Google Drive

1. Create a folder in Google Drive for receipt uploads
2. Copy the folder ID from the URL: `drive.google.com/drive/folders/XXXXX`

### 4. Deploy Google Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Create a new project
3. Copy the contents of `google/script.gs` into the editor
4. Update `RECEIPTS_FOLDER_ID` with your Drive folder ID
5. Click **Settings** (gear icon) > Check **"Show appsscript.json manifest file"**
6. Update `appsscript.json`:

```json
{
  "timeZone": "America/Sao_Paulo",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
  ],
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  }
}
```

7. Run `testDrivePermission()` to authorize permissions
8. Click **Deploy** > **New deployment**
9. Select **Web app**, set access to **Anyone**, and deploy
10. Copy the Web App URL

### 5. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Google Apps Script API URL
PUBLIC_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Payment key (CPF, email, phone, or random key)
PUBLIC_PLOX_KEY=YOUR_PAYMENT_KEY
```

### 6. Run Locally

```bash
npm run dev
```

Visit `http://localhost:4321` to see the site.

### 7. Deploy to GitHub Pages

1. Push your code to GitHub
2. Go to **Settings** > **Secrets and variables** > **Actions**
3. Add the following secrets:
   - `PUBLIC_API_URL` - Your Google Apps Script URL
   - `PUBLIC_PLOX_KEY` - Your payment key

4. Go to **Settings** > **Pages**
5. Set source to **GitHub Actions**
6. Push to `main` branch to trigger deployment

## Customization

### Colors & Theme

Edit `src/styles/theme.css` to customize colors, fonts, and spacing.

### Content

- Update couple names and date in page components
- Replace images in `public/images/`
- Edit page content in `src/pages/`

### Gift Ideas

Edit the `gifts` array in `src/pages/presentes.astro` to customize gift options.

## License

This project is for personal, non-commercial use only. Feel free to fork and adapt for your own wedding!

If you plan on using this to make money, please don't.

---

Made with love for Bruna & Marcos
