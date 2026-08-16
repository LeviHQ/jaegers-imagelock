# Jaegers-ImageLock — Complete Project Documentation

> **Hackathon:** Omnikon National Hackathon 2026  
> **Problem Statement:** `Omni_CyberTech_20` — Accessible Password-less Authentication  
> **Team:** Jaegers  
> - Deepanshi — Team Leader  
> - Adarsh Mishra — Team Member  

---

## 1. What is Jaegers-ImageLock?

Jaegers-ImageLock is a **password-less authentication system** designed for accessibility and low-literacy users. Instead of typing a text password, users create and repeat an ordered sequence of pictures (icons). The picture sequence is converted into a secure hash on the user's device before it is ever sent to the server.

### Core idea
- Your **picture sequence** = your password.
- Order matters.
- At least **4 pictures** from **2 or more groups** are required.
- The plain sequence **never leaves the device**.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | TanStack Start v1 (React 19) | Full-stack React framework with SSR/SSG and server functions |
| **Build tool** | Vite 8 | Bundling and dev server |
| **Language** | TypeScript | Type-safe frontend and backend code |
| **Styling** | Tailwind CSS v4 | Utility-first styling with CSS variables |
| **UI components** | shadcn/ui + Radix UI primitives | Accessible dialogs, buttons, forms, switches |
| **Icons** | Lucide React | 500+ icon library used for picture passwords |
| **Backend / Auth** | Lovable Cloud (Supabase) | Authentication, database, row-level security |
| **State management** | TanStack Query | Server state caching for profile data |
| **Notifications** | Sonner | Toast messages |
| **Validation** | Zod | Input validation on client and server |
| **Deployment target** | Edge / serverless (Cloudflare Workers via TanStack Start) | Production builds run on edge functions |

### Key dependencies
- `@tanstack/react-start` — server functions and routing
- `@supabase/supabase-js` — Supabase client
- `tailwindcss` v4, `@tailwindcss/vite`, `tw-animate-css`
- `lucide-react` — icons
- `zod` — schema validation
- `sonner` — toast notifications

---

## 3. Features Implemented

### Authentication
1. **Registration** — username, recovery email, picture sequence selection.
2. **Login** — username + repeat picture sequence.
3. **Account lockout** — 3 failed attempts lock the account for 60 seconds.
4. **Forgot sequence / recovery** — 6-digit one-time code sent to registered email (simulated in demo), then set a brand new sequence.
5. **Change authentication pattern** — 2-step modal: verify current sequence, then set a new one.
6. **Account deletion** — permanently removes profile, reset codes, and auth user.

### Picture sequence UX
- **25 icon categories**, 20 icons each = **500 total pictures**.
- Categories are shown as a searchable vertical list.
- Tapping a category opens a **4×4 (Medium) paged grid** that can be swiped horizontally.
- Grid sizes can be changed in settings: **Small 5×5**, **Medium 4×4**, **Large 3×3**.
- **Search** filters both categories and individual icons.
- **Sequence preview** shows selected pictures in order with Undo / Done.
- **Sequence strength indicator** gives real-time feedback (Too short / Weak / Fair / Strong / Very strong).

### Accessibility
- **Tap-and-hold to hear icon names** via browser Web Speech API.
- **Sound narration toggle** in settings.
- **Large, clear icons** with minimal text.
- **Light / Dark mode** toggle.
- **Adjustable picture size** for low-vision users.

### Settings
- Floating **Settings** button in top-right corner.
- Controls: Sound narration, Light/Dark appearance, Picture size.
- Preferences persist in `localStorage`.

---

## 4. User Flow

### 4.1 Registration (`/register`)
1. User enters a **username** (3–32 chars, letters/numbers/underscores).
2. User enters a **recovery email**.
3. User opens a category or searches for a picture.
4. User taps at least **4 pictures** from **2+ categories** in order.
5. Sequence preview updates; strength bar shows quality.
6. User taps **Done** to confirm the sequence.
7. User taps **Create account**.
8. System checks username/email availability, hashes the sequence on the device, creates a Supabase auth user, and inserts a profile row.
9. On success, user is redirected to the **login page**.

### 4.2 Login (`/`)
1. User enters **username**.
2. User re-selects the same picture sequence in the same order.
3. User taps **Done**, then **Log in**.
4. System hashes the sequence and calls `signInWithPassword`.
5. On success: failed attempts are cleared and user is redirected to `/home`.
6. On failure: failed attempt counter increments; after **3 failures** account is locked for **60 seconds** with a red lock banner.

### 4.3 Forgot Sequence (`/forgot`)
1. User enters registered email.
2. System generates a 6-digit code, stores it in `reset_codes` with 10-minute expiry.
3. Demo mode shows the code on screen (real email sending would replace this).
4. User enters the code and picks a **new** picture sequence.
5. System verifies the code, updates the auth password hash, and marks code as used.
6. User is redirected to login.

### 4.4 Home (`/home`)
1. Authenticated route; unauthenticated users are redirected to `/`.
2. Shows profile card with username, recovery email, and action buttons.
3. **Welcome banner** with personalized greeting.
4. **How it works** step-by-step guide.
5. Actions:
   - **Change Authentication Pattern** — opens 2-step modal.
   - **Log out** — clears session and redirects to login.
   - **Delete account** — confirmation dialog, then permanent deletion.

---

## 5. System Flow / Architecture

### 5.1 Where the password lives
The "password" is never stored as pictures. It becomes a **64-character SHA-256 hex string** on the client:

```
material = "imagelock:v1:<lowercase-username>:<icon-id-1>><icon-id-2>>..."
hash     = SHA-256(material) → 64 hex chars
```

- The hash is computed in the browser using the **Web Crypto API**.
- The plain sequence never leaves the device.
- The SHA-256 hash is sent as the `password` to Supabase Auth.
- Supabase Auth **bcrypt-hashes** it again before storing in `auth.users.encrypted_password`.

### 5.2 Auth user model
- Each user has a hidden auth email: `<username>@users.imagelock.app`.
- This email is never shown to the user; it exists only because Supabase Auth requires an email/password pair.
- The user's real recovery email is stored in the `public.profiles` table.

### 5.3 Data flow diagrams

#### Registration
```
User picks sequence
       ↓
Browser: hashSequence(username, sequence) → SHA-256 hex
       ↓
Server function / supabase.auth.signUp
       ↓
Supabase Auth: bcrypt(hash) → auth.users.encrypted_password
       ↓
Database trigger: insert profile(id, username, email)
```

#### Login
```
User re-enters sequence
       ↓
Browser: hashSequence(username, sequence) → SHA-256 hex
       ↓
supabase.auth.signInWithPassword(email=hidden, password=hash)
       ↓
Supabase compares bcrypt(hash) with stored hash
       ↓
Success → session cookie + redirect to /home
Failure → record failed attempt → possible lockout
```

#### Account deletion
```
User confirms delete
       ↓
Primary: supabase.rpc("delete_own_account")
       ↓
Database function deletes reset_codes, profiles, auth user
       ↓
Fallback: server function deleteAccount() using supabaseAdmin
       ↓
Clear TanStack Query cache + signOut + redirect
```

---

## 6. Security

### 6.1 Hashing
- **Client-side SHA-256** using Web Crypto API (`crypto.subtle.digest`).
- Server-side **bcrypt** via Supabase Auth.
- Plain icon sequence is never transmitted or stored.

### 6.2 Brute-force protection
- `MAX_ATTEMPTS = 3`
- `LOCK_SECONDS = 60`
- After 3 wrong logins, the account is locked for 60 seconds.
- Failed attempts and lock timestamp are stored in `profiles.failed_attempts` and `profiles.locked_until`.
- Lockout checks run as server functions using the service role key.

### 6.3 Row Level Security (RLS)
- `profiles` table: users can only **SELECT/UPDATE their own row** (`auth.uid() = id`).
- `reset_codes` table: fully protected; only server-side admin access reads/writes it.
- No anonymous access to user data.

### 6.4 Account enumeration prevention
- Forgot-sequence endpoint always returns `sent: true`, even if the email does not exist.
- This prevents attackers from discovering which emails are registered.

### 6.5 Input validation
- Username: 3–32 chars, `^[a-zA-Z0-9_]+$`
- Email: standard email format, max 255 chars
- Hash: 64-char hex string validated by Zod
- Recovery code: exactly 6 digits

### 6.6 Sequence rules
- Minimum **4 pictures**.
- Pictures must come from **at least 2 different categories**.
- Enforced client-side in `IconGrid` and server-side in validation.

### 6.7 Account deletion
- Uses a database-level function `delete_own_account` as the primary path so it works without server secrets.
- Falls back to a server function with admin privileges if needed.
- Cascading deletion of `reset_codes`, `profiles`, and auth user.

---

## 7. Database Schema

### `public.profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key, references `auth.users(id)` |
| `username` | text | Unique, 3–32 chars |
| `email` | text | Recovery email |
| `failed_attempts` | integer | Default 0 |
| `locked_until` | timestamptz | NULL when not locked |
| `created_at` | timestamptz | Auto `now()` |

### `public.reset_codes`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key, `gen_random_uuid()` |
| `user_id` | uuid | References `auth.users(id)` |
| `code` | text | 6-digit numeric code |
| `expires_at` | timestamptz | 10-minute expiry |
| `used` | boolean | Default false |
| `created_at` | timestamptz | Auto `now()` |

### RLS policies
- `Users can view own profile` — SELECT on `profiles` where `auth.uid() = id`
- `Users can update own profile` — UPDATE on `profiles` where `auth.uid() = id`

### Important note
The actual password hash (bcrypt) lives in the **`auth.users.encrypted_password`** column, not in `public.profiles`. The `profiles` table only stores public-safe metadata.

---

## 8. File Structure

```
src/
├── components/
│   ├── SettingsButton.tsx          # Floating settings (sound/theme/icon size)
│   └── imagelock/
│       ├── ChangePatternDialog.tsx # 2-step change-sequence modal
│       └── IconGrid.tsx            # Category list, search, paged icon grid
├── integrations/
│   └── supabase/
│       ├── auth-attacher.ts        # Attaches bearer token to server functions
│       ├── auth-middleware.ts      # requireSupabaseAuth middleware
│       ├── client.server.ts        # Server-side Supabase clients
│       ├── client.ts               # Browser Supabase client (auto-generated)
│       └── types.ts                # Supabase generated types
├── lib/
│   ├── imagelock/
│   │   ├── auth.functions.ts       # Server functions (register, lockout, recovery, delete)
│   │   ├── auth.shared.ts          # Shared constants and Zod schemas
│   │   ├── hash.ts                 # SHA-256 sequence hashing
│   │   ├── icons.ts                # 500 icons, 25 categories, colors
│   │   ├── settings.ts             # Theme/sound/icon-size state
│   │   ├── speak.ts                # Web Speech API narration
│   │   └── strength.ts             # Sequence strength calculator
│   └── utils.ts                    # Tailwind merge helper
├── routes/
│   ├── __root.tsx                  # Root layout with <Outlet />, Toaster
│   ├── index.tsx                   # Login page
│   ├── register.tsx                # Registration page
│   ├── forgot.tsx                  # Forgot sequence / recovery
│   ├── _authenticated/
│   │   ├── route.tsx               # Auth guard layout
│   │   └── home.tsx                # Post-login home + guide
│   └── api/                        # Public API routes (if any)
├── router.tsx                      # TanStack Router setup
├── server.ts                       # Server entry
├── start.ts                        # TanStack Start instance + middleware
└── styles.css                      # Tailwind v4 theme variables + custom utilities
```

---

## 9. Environment Variables

These variables are required for the app to connect to Supabase:

| Variable | Purpose | Where needed |
|----------|---------|--------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Browser bundle |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anonymous/public Supabase key | Browser bundle |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin-level server key | Server functions (lockout, delete fallback) |

### Notes
- `VITE_*` variables are bundled into the frontend.
- `SUPABASE_SERVICE_ROLE_KEY` is **server-only** and should never be exposed to the browser.
- On Lovable Cloud these are managed automatically.
- On Vercel / other hosts, add them in the dashboard's Environment Variables section.

---

## 10. Design System

### Theme
- **Dark mode default:** deep lavender/blue background.
- **Light mode:** soft lavender/cream background.
- **Primary accent:** lavender/blue with **gold hints**.
- **Destructive:** soft red for errors and delete actions.

### Colors (oklch)
- Background dark: `oklch(0.18 0.04 275)`
- Background light: `oklch(0.26 0.035 285)` (adjusted for contrast)
- Primary: `oklch(0.78 0.1 265)` — lavender
- Accent: `oklch(0.8 0.13 85)` — gold
- Destructive: `oklch(0.7 0.16 25)` — red

### Typography
- Clean sans-serif system font stack.
- Large headings, readable body text.
- Minimal text overall.

---

## 11. Accessibility Highlights

- **No typing required** for the actual password — great for low-literacy users.
- **Tap-and-hold narration** speaks icon names aloud.
- **High contrast** mode available via light/dark toggle.
- **Adjustable icon size** helps users with low vision.
- **ARIA labels** on every icon button.
- **Screen-reader friendly** sequence preview and strength indicator.

---

## 12. Known Limitations / Future Work

| Feature | Status |
|---------|--------|
| Real email OTP delivery | Simulated in demo; integrate SendGrid/Resend for production |
| Lockout on Vercel | Requires `SUPABASE_SERVICE_ROLE_KEY`; currently opportunistic fallback |
| Biometric / PIN backup | Not implemented |
| Admin dashboard | Not implemented |
| Multi-language narration | English only via browser TTS |

---

## 13. How to Run Locally

```bash
# 1. Clone the repository
git clone <repo-url>
cd <repo-name>

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open http://localhost:8080
```

---

## 14. Deployment

- **Lovable preview:** automatic on every change.
- **Vercel:** connect the GitHub repo and add the environment variables listed in Section 9.
- **Production build:** `npm run build`

---

## 15. Quick Reference: Important Functions

| Function | File | Purpose |
|----------|------|---------|
| `hashSequence(username, sequence)` | `src/lib/imagelock/hash.ts` | Client-side SHA-256 |
| `sequenceError(sequence)` | `src/lib/imagelock/icons.ts` | Validates 4+ icons / 2+ groups |
| `sequenceStrength(sequence)` | `src/lib/imagelock/strength.ts` | Returns strength score + label |
| `getLockState` | `src/lib/imagelock/auth.functions.ts` | Check lockout status |
| `recordFailedAttempt` | `src/lib/imagelock/auth.functions.ts` | Increment failures / lock |
| `requestRecoveryCode` | `src/lib/imagelock/auth.functions.ts` | Generate 6-digit reset code |
| `resetSequence` | `src/lib/imagelock/auth.functions.ts` | Verify code + update password |
| `deleteAccount` | `src/lib/imagelock/auth.functions.ts` | Delete user + profile + codes |

---

*End of documentation. For questions or updates, edit this file in the Lovable editor or push changes to the connected GitHub repository.*
