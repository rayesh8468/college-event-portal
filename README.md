# VIT Event Portal

A comprehensive event management platform for VIT students, faculty, and administrators.

## 🌐 Live Demo

**URL:** https://main.d10lvohwv4di32.amplifyapp.com

## ✨ Features

- **User Authentication** - Login/Register with college email (`@vitapstudent.ac.in`)
- **Role-Based Access** - Students, HODs (DeptHeads), and SuperAdmins
- **Event Management** - Browse, register, and manage events
- **Payment Gateway** - Simulated payment flow for paid events (Razorpay-ready)
- **My Registrations** - Track registration status and payment status
- **Email Confirmation** - Mock email confirmation in API response
- **HOD Dashboard** - Create and manage department events
- **Admin Panel** - User management and system oversight

## 👥 Demo Accounts

All accounts use password: **`Vit@12345`**

| Email | Role | Description |
|-------|------|-------------|
| ram.21cse@vitapstudent.ac.in | Student | Regular student account |
| aravind.21cse@vitapstudent.ac.in | Student | Regular student account |
| praveen.21cse@vitapstudent.ac.in | Student | Regular student account |
| sai.21cse@vitapstudent.ac.in | Student | Regular student account |
| vikram.21cse@vitapstudent.ac.in | Student | Regular student account |
| vijay.21cse@vitapstudent.ac.in | Student | Regular student account |
| john.21cse@vitapstudent.ac.in | Student | Regular student account |
| alice.21cse@vitapstudent.ac.in | Student | Regular student account |
| bob.21cse@vitapstudent.ac.in | Student | Regular student account |
| hod.cse@vitapstudent.ac.in | HOD | Head of CSE Department |
| hod.ece@vitapstudent.ac.in | HOD | Head of ECE Department |
| hod.it@vitapstudent.ac.in | HOD | Head of IT Department |
| admin@vitapstudent.ac.in | Admin | System Administrator |

## 📅 Sample Events

| Event | Fee | Date | Venue |
|-------|-----|------|-------|
| Python Basics Workshop | FREE | Oct 15, 2026 | Computer Lab 3, Block A |
| Web Development Bootcamp | ₹50 | Oct 22, 2026 | Computer Centre, Block A |
| Admin Created Event | FREE | Dec 22, 2026 | TBD |

## 💰 Payment Flow

1. **Register** for a paid event → Creates registration with `paymentStatus: pending`
2. **Pay** → Payment page shows event details and amount
3. **Verify** → Payment verification updates:
   - Payment status → `paid`
   - Registration status → `confirmed`
   - Event confirmed count → +1

## 🔧 Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** AWS DynamoDB
- **Authentication:** AWS Cognito
- **Hosting:** AWS Amplify
- **Storage:** AWS S3

## 📁 Project Structure

```
college-event-portal/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (student)/         # Student pages (events, my-registrations)
│   ├── (hod)/            # HOD pages (dashboard, create event)
│   ├── (admin)/          # Admin pages (users, reports)
│   └── api/              # API routes
├── components/           # React components
│   ├── ui/              # UI components (Button, Card, etc.)
│   ├── events/          # Event-related components
│   └── layout/          # Layout components (Navbar, Footer)
├── lib/                 # Utility libraries
│   ├── aws-credentials.ts  # AWS credentials loader
│   ├── aws-config.json     # AWS config (filled during build)
│   ├── dynamodb.ts         # DynamoDB client
│   ├── cognito.ts          # Cognito client
│   └── auth-context.tsx    # Auth context provider
├── amplify.yml          # AWS Amplify build configuration
└── package.json
```

## 🔑 Environment Variables

Set these in AWS Amplify Console → App Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `AMAZON_ACCESS_KEY_ID` | AWS access key for DynamoDB/S3/Cognito |
| `AMAZON_SECRET_ACCESS_KEY` | AWS secret key |
| `AMAZON_REGION` | AWS region (ap-south-1) |
| `NEXT_PUBLIC_DEMO_MODE` | Enable demo mode (true) |
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID |
| `COGNITO_CLIENT_ID` | Cognito App Client ID |
| `COLLEGE_EMAIL_DOMAIN` | Allowed email domain (vitapstudent.ac.in) |

## 🚀 Deployment

The app is deployed on AWS Amplify with automatic builds on git push to `main`.

### Build Process

1. `npm ci` - Install dependencies
2. Write AWS credentials to `lib/aws-config.json` from environment variables
3. `npm run build` - Build Next.js app
4. Deploy `.next` directory to Amplify

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/events` | List all events |
| GET | `/api/events/[id]` | Get event details |
| POST | `/api/events` | Create event (HOD/Admin) |
| POST | `/api/register` | Register for event |
| GET | `/api/my-registrations` | Get user's registrations |
| POST | `/api/payment/create` | Create payment order |
| POST | `/api/payment/verify` | Verify payment |
| GET | `/api/payments` | List payments (Admin) |
| GET | `/api/users` | List users (Admin) |

## 🧪 Testing

### Test Payment Flow

1. Login as a student (e.g., `ram.21cse@vitapstudent.ac.in`)
2. Go to Events → Web Development Bootcamp (₹50)
3. Click "Pay Now" or "Register & Pay"
4. Complete the simulated payment
5. Check My Registrations → Status should be "confirmed"

### Test Free Event

1. Login as a student
2. Go to Events → Python Basics Workshop (FREE)
3. Click "Register"
4. Check My Registrations → Status should be "pending" (no payment needed)

## 📄 License

MIT License - Built for VIT-AP University

## 👨‍💻 Support

For issues or questions, contact: support@vitapstudent.ac.in
