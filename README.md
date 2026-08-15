# Jaegers-ImageLock 🔒

**A secure, accessible, password-less authentication system**

Built for the **Omnikon National Hackathon 2026**
Problem Statement: `Omni_CyberTech_20` — Accessible Password-less Authentication

### Team Jaegers
- **Deepanshi** — Team Leader
- **Adarsh Mishra** — Team Member

---

# ImageGuard Login

Build a web app called "Jaegers-ImageLock" — a secure, password-less authentication 

system that uses image sequences instead of text passwords, designed for accessibility 

and low-literacy users.

THEME:

- Complete dark mode UI (dark background, near-black surfaces)

- Red as the primary accent color (buttons, active states, highlights, borders)

- Large, clear icons and minimal text — should feel simple and uncluttered

- Clean, modern, professional look — not childish despite being icon-based

CORE CONCEPT:

Instead of typing a password, users create their login by selecting a sequence of 

images (icons) in a specific order. To log in, they must reselect the same images 

in the same order.

PAGES & FLOWS:

1. REGISTER PAGE (new user)

   - Fields: Username, Email (email is only used for account recovery)

   - Below that, show a grid of icons (start with a set of around 40-60 simple, 

     universally recognizable icons — animals, fruits, vehicles, household objects — 

     we'll expand the icon pool later)

   - User taps icons in order to build their sequence (e.g. Cow > Sun > House > Tree)

   - Show the selected sequence as a preview row with "Edit" and "Done" buttons

   - On submit, the sequence must be hashed before storing (never store or transmit 

     it in plain text) — treat it like a password hash

   - After successful registration, redirect to login

2. LOGIN PAGE (returning user)

   - Field: Username

   - Same icon grid appears — user re-selects their image sequence

   - "Edit" and "Done" buttons to confirm selection

   - On submit, compare hashed input against stored hash

   - If correct: log in and go to homepage

   - If incorrect: increment failed attempt counter, show an error

   - After 3 failed attempts: show an automatic "Account Locked" state on the same 

     page (temporary lockout, e.g. disable the grid for a short cooldown period) — 

     this is a core security feature, make it visually clear (red lock icon/banner)

3. FORGOT SEQUENCE (recovery)

   - A "Forgot Sequence?" link on the login page

   - User enters their registered email

   - Simulate sending a secure reset link/OTP to that email (never reveal or send 

     the actual old sequence)

   - After verification, let the user set a brand new image sequence, which gets 

     hashed and replaces the old one

4. HOMEPAGE (after login)

   - Large, friendly welcome message: "Hello [Username], welcome to your simple, 

     accessible, secure authentication system."

   - A "How It Works" / User Guide section below — explain in very simple language 

     (short sentences, icons instead of paragraphs) how the system works and why 

     it's secure: e.g. "Your login is a picture password only you know", "We never 

     store your actual sequence — it's encrypted", "3 wrong tries locks your account 

     for safety"

   - Top corner: profile area showing a default profile icon, the username, and email

5. CHANGE AUTHENTICATION PATTERN

   - A button (near profile or on homepage) labeled "Change Authentication Pattern"

   - Opens a 2-step popup/modal:

     - Step 1: Verify current image sequence (same icon-grid selection UI)

     - Step 2: If correct, let user pick and save a new image sequence (hashed 

       before saving)

TECHNICAL NOTES:

- Use a proper backend/auth system (e.g. Supabase) so data persists — this needs 

  to be a working prototype, not just static UI

- Hash all image sequences before storage — never store plain sequences

- Add basic rate-limiting logic for the 3-attempt lockout

- Keep the whole experience mobile-friendly and responsive

SCOPE:

This is a focused authentication demo, not a full platform — do not add unrelated 

features. The entire product IS the authentication system: register, login, lockout, 

recovery, homepage/guide, and change-pattern flow.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e371ec08-46a9-4406-b6b3-cd40c968ef32).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
