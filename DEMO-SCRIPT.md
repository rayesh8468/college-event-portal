# VIT Event Portal — Demo Script

**Live URL:** https://main.d10lvohwv4di32.amplifyapp.com
**Duration:** 12–15 minutes + Q&A
**Audience:** Evaluators / faculty / peers

---

## 1. The Hook (0:00 – 0:45)

> "Today at VIT-AP, registering for a college event means filling a Google Form, sending a UPI screenshot on WhatsApp, and hoping the coordinator saw it. HODs have no idea how many students actually showed up, and students have no record of what they registered for.
>
> The VIT Event Portal replaces all of that with one system: students register and pay in under a minute, HODs create and track events, and every record lives in one place on AWS."

**Talking points to land:**
- One portal, three roles: Student / HOD / Admin
- Free *and* paid events in the same flow
- Every action is recorded — no more lost WhatsApp screenshots

---

## 2. Architecture Overview (0:45 – 1:30)

Show a simple diagram (or draw it live — drawing it scores points):

```
                    ┌─────────────────────┐
   Students/HODs ──▶│  AWS Amplify        │  Next.js hosting + CI/CD
                    │  (this portal)      │  auto-deploys from GitHub
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        ┌──────────┐    ┌───────────┐    ┌───────────┐
        │ Cognito  │    │ DynamoDB  │    │    S3     │
        │  Auth    │    │ 5 tables  │    │  uploads  │
        │  + roles │    │           │    │           │
        └──────────┘    └───────────┘    └───────────┘

        VPC 10.0.0.0/16 provisioned for private resources
        (public + private subnets across 2 AZs)
```

**Talking points:**
- Serverless — no servers to manage, scales automatically
- Cognito handles auth *and* role groups (Students / DeptHeads / SuperAdmins)
- DynamoDB: 5 tables — Users, Events, Registrations, Payments, OD requests
- Pushing to GitHub automatically rebuilds and deploys (show the Amplify build history if asked)

---

## 3. Login + Role-Based Routing (1:30 – 3:30)

**Open a private/incognito window FIRST** so you can show two roles side by side.

**Tab 1 — Student:** `ram.21cse@vitapstudent.ac.in` / `Vit@12345`
- Show the student dashboard: events, my registrations
- Point out: *"Only students can register for events"*

**Tab 2 — HOD:** `hod.cse@vitapstudent.ac.in` / `Vit@12345`
- Show the HOD dashboard with event management
- Point out: *"Same login page, completely different app — the routing is role-based, enforced server-side"*

> "The portal knows who you are from your Cognito token. A student literally cannot reach the HOD dashboard — it's not hidden, it's blocked."

---

## 4. Browse Events (3:30 – 4:30)

On the student tab, go to **Events**. Three events are live:

| Event | Fee | Date |
|-------|-----|------|
| Python Basics Workshop | FREE | Oct 15, 2026 |
| Web Development Bootcamp | ₹50 | Oct 22, 2026 |
| Admin Created Event | FREE | Dec 22, 2026 |

**Talking point:** free and paid events run through the *same* registration flow — the only difference is a payment step.

---

## 5. Free Event Registration (4:30 – 5:30)

Register for **Python Basics Workshop** (free):
1. Click **Register**
2. Instant confirmation

**Talking points:**
- No payment step for free events
- A confirmation record is created immediately
- Open **My Registrations** → the event appears with its status

> "Every registration is a record in DynamoDB — the coordinator can export it, the student can prove it."

---

## 6. Payment Flow — THE CENTREPIECE (5:30 – 9:00)

**Have the DynamoDB console open in a third tab** (Tables → College_Payments → Explore items). This is your wow moment.

**Setup:** use a student with no registration yet — `aravind.21cse@vitapstudent.ac.in` / `Vit@12345` (or register a fresh account live: any `name.21cse@vitapstudent.ac.in` email).

**Live walkthrough:**

1. Open **Web Development Bootcamp** (₹50) → click **Register & Pay**
2. **Payment page** shows: event details, amount ₹50, order summary
3. Click **Pay ₹50**
4. → Registration is created with status `pending`, payment `pending`
5. **Payment verifies** → registration flips to `confirmed`
6. **Now switch to the DynamoDB tab** and refresh:
   - `College_Payments` — the payment record, status `paid`
   - `College_Registrations` — status `confirmed`, `confirmedAt` timestamp
   - `College_Events` — the event's `confirmedCount` just incremented

> "That ₹50 went through a full gateway flow: order creation, payment capture, server-side verification, then the registration is confirmed and the event's participant count updates. All of it atomic — if the payment fails, no registration is confirmed."

**If asked "is the payment real?":** be honest — *"The gateway is mocked for this demo (demo mode), but the flow is exactly the Razorpay/UPI integration pattern — create order, capture, verify signature. Swapping in live keys is a config change, not a rewrite."*

---

## 7. My Registrations (9:00 – 10:00)

Open **My Registrations**:

- Sections: **Pending Payment** (unpaid registrations), **Pending Confirmation**, **Confirmed**
- Show the event you just paid for sitting in **Confirmed**
- Show a second event in **Pending Payment** with a **Complete Payment** button

> "This is the student's single source of truth — what they registered for, what they still owe, what's confirmed."

---

## 8. HOD Creates an Event (10:00 – 11:00)

On the HOD tab, create an event **live**:

- Title: something topical (e.g. *"AI/ML Workshop"*)
- Department: CSE, Category: Technical
- Date/time/venue, max participants, fee (try **₹75** to show a new price point)
- Submit → event appears in the student's event list immediately

> "HODs own their department's events. The event is live the moment it's created — no deploy, no coordinator in the loop."

**Bonus if time permits:** log in as `admin@vitapstudent.ac.in` / `Vit@12345` to show the admin user management view.

---

## 9. Close (11:00 – 12:00)

> "To recap: role-based auth with Cognito, event management for HODs, a full registration and payment flow for students, and every record queryable in DynamoDB — all serverless on AWS, deployed automatically from GitHub."

**Then invite questions.**

---

## Demo Accounts

Password for all: **`Vit@12345`**

| Email | Role | Use it for |
|-------|------|-----------|
| `ram.21cse@vitapstudent.ac.in` | Student | Already has registrations — shows history |
| `aravind.21cse@vitapstudent.ac.in` | Student | Clean account — do the live payment here |
| `hod.cse@vitapstudent.ac.in` | HOD | Create an event live |
| `admin@vitapstudent.ac.in` | Admin | User management view |

*You can also register a brand-new account live — any `yourname.21cse@vitapstudent.ac.in` email works.*

---

## The Three Wow Moments (in priority order)

1. **Live DynamoDB update** during payment — pending → paid while you watch
2. **Role-based routing** — same login, two completely different apps
3. **HOD creates an event** and it appears in the student's list with zero deployment

---

## Prep Checklist (do this the day before)

- [ ] Open these tabs in advance: **site**, **login**, **events**, **DynamoDB console** (College_Payments + College_Registrations), **Amplify console** (build history)
- [ ] Verify login works for all four demo accounts
- [ ] Confirm `aravind.21cse` has **no** registration for Web Development Bootcamp (so you can register live)
- [ ] Check the site on the actual venue WiFi — or tether from your phone as backup
- [ ] Have a **screenshot fallback** of the payment flow in case the network dies
- [ ] Clear your own browser's saved logins so the demo accounts log in cleanly

---

## Q&A Prep

**"Why DynamoDB instead of MySQL/PostgreSQL?"**
> The access pattern is simple key-value lookups by user and event, with no complex joins. DynamoDB gives single-digit-millisecond reads at any scale with zero database administration — and it's in the AWS free tier, which matters for a student project.

**"Is the payment gateway real?"**
> It's implemented in demo mode following the standard create-order → capture → verify pattern. Going live means adding Razorpay keys and enabling the signature verification — the flow is already built for it.

**"How does authentication work?"**
> AWS Cognito. Users authenticate with their college email; Cognito issues a JWT that every API route verifies server-side. Role groups (Students / DeptHeads / SuperAdmins) drive what each user can reach.

**"Why not send real emails?"**
> Amazon SES requires a paid account and production-access approval, which isn't available for this demo. The confirmation email is generated and returned in the API response — the SES integration point is ready, it just needs credentials.

**"How does this scale?"**
> Everything is serverless. Amplify scales the frontend, Lambda-based API routes scale with traffic, and DynamoDB is effectively unlimited. There's no server to resize.

**"What's the VPC for?"**
> It's provisioned for future private resources — a database in private subnets that isn't internet-exposed. Amplify Hosting itself can't run inside a VPC, so the pattern would be a VPC-attached Lambda bridging to private resources.

**"What would you add next?"**
> Real payment gateway keys, SES email, an OD (on-duty) approval workflow for faculty, QR-code attendance check-in, and an analytics dashboard for HODs.

---

*Built with Next.js · AWS Amplify · Cognito · DynamoDB · S3*
