# Test Card 01 — Signup & Authentication

**Priority:** Critical
**Precondition:** Fresh browser (incognito), no existing account

---

## Tests

- [ ] Navigate to `/signup`
- [ ] Fill in full name, email (use a REAL email you can check), and password
- [ ] Click "Create account"
- [ ] Verify you see "Check your inbox to confirm your email address" (if email confirmation is on) OR get redirected to `/account` (if confirmation is off)
- [ ] If confirmation required: check your email inbox for the confirmation link
- [ ] Click the confirmation link → verify it lands on `/confirm` and redirects to `/account`
- [ ] Verify you received a **welcome email** from `noreply@frulahomes.com` with:
    - [ ] Greeting with your first name
    - [ ] Three feature cards (Sell, Dream Home, Paperwork)
    - [ ] "Start browsing listings" button
    - [ ] Personal note from Missa at the bottom
- [ ] Verify the welcome email's Reply-To is `missa@frulahomes.com`
- [ ] Click "Sign out" on the account page
- [ ] Verify you land on the homepage

## Password reset flow

- [ ] Navigate to `/login`
- [ ] Click "Forgot password?" link
- [ ] Enter the email you just signed up with
- [ ] Click "Send reset link"
- [ ] Verify you see the success state with the "Don't see it?" help card
- [ ] Check your email for the reset link
- [ ] Click the link → verify you land on `/reset-password`
- [ ] Enter a new password + confirm it
- [ ] Click "Save new password"
- [ ] Verify you see "All set!" and get redirected to `/account`
- [ ] Sign out and sign back in with the new password

## Edge cases

- [ ] Try signing up with a duplicate email → should see an error message
- [ ] Try signing in with wrong password → should see an error message
- [ ] Try accessing `/account` while logged out → should redirect to `/login`
- [ ] Try accessing `/sell` while logged out → should redirect to `/login`
