# Music Journal App

A web application for students to track their progress in music class through a journal.

## Features

- **Dashboard**: View user information and navigate to the journal
- **Journal Timeline**: Display entries in a chronological order with newest at the top
- **Multiple Entry Types**: Add video or document entries with distinct icons
- **Responsive Design**: Optimized for both desktop and mobile devices

## Project Structure

- **index.html**: Landing page that checks login status and redirects accordingly
- **dashboard.html**: User dashboard with information and navigation to journal
- **journal.html**: Main journal interface with timeline of entries
- **style.css**: Shared styles for the application
- **backup/**: Contains the original login implementation (not used in production)

## Vercel Deployment Setup

This application is configured to be deployed on Vercel with authentication handled by another Vercel app. The authentication flow works as follows:

1. When a user logs in on the authentication site, two localStorage keys are set:
   - `musicUserLoggedIn`: Set to 'true' when the user is authenticated
   - `musicUsername`: The username of the logged-in user

2. This Music Journal app:
   - Checks for the presence of these keys on every page load
   - If the keys exist, the user is shown the dashboard/journal content
   - If the keys don't exist, the user is redirected to Google (change this as needed)

3. When a user logs out:
   - These localStorage keys are cleared
   - The user is redirected back to Google (change this as needed)

### Configuration Changes for Production

Before deploying to production, make the following changes:

1. Update the redirect URL in `index.html`, `dashboard.html` and `journal.html` from Google to your actual login page:
   ```javascript
   window.location.href = 'https://your-auth-site-url.vercel.app';
   ```

2. Update the logout redirect to point to your authentication site:
   ```javascript
   window.location.href = 'https://your-auth-site-url.vercel.app';
   ```

## Local Development

1. Clone the repository
2. Start a local server:
   ```
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser
4. For testing without the authentication site, manually set localStorage values:
   ```javascript
   localStorage.setItem('musicUserLoggedIn', 'true');
   localStorage.setItem('musicUsername', 'TestUser');
   ```
5. Refresh the page to access the dashboard

## Dependencies

- No external JavaScript libraries
- Uses localStorage for data persistence
- Font Awesome for icons
