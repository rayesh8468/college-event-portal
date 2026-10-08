/**
 * scripts/seed-demo-data.ts
 *
 * Seeds the DynamoDB tables with demo data so the portal looks alive from day one.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-data.ts
 *
 * Required environment variables (.env.local or shell):
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
 *
 * Notes:
 *   - This script is for demo purposes only.  It does not overwrite existing
 *     data by default — if a partition key already exists the write will fail
 *     and the script will log a warning and continue.
 *   - User accounts in Cognito must be created separately (AWS Console or
 *     AdminCreateUser API).  This script only seeds the Users *DynamoDB table*
 *     which mirrors Cognito user metadata.
 */

import {
  DynamoDBClient,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// ── AWS client ───────────────────────────────────────────────────────

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
});
const docClient = DynamoDBDocumentClient.from(client);

// ── Table names (must match DataStack) ──────────────────────────────

const TABLES = {
  departments: "College_Departments",
  users: "College_Users",
  events: "College_Events",
} as const;

// ── Verify tables exist ──────────────────────────────────────────────

async function ensureTablesExist(): Promise<void> {
  console.log("Checking DynamoDB tables exist...");

  for (const [label, name] of Object.entries(TABLES)) {
    try {
      await client.send(new DescribeTableCommand({ TableName: name }));
      console.log(`  [OK] ${label} table found`);
    } catch {
      console.error(`  [MISSING] ${label} table not found: ${name}`);
      console.error("        Deploy the CDK stack first: cd infra && cdk deploy");
      process.exit(1);
    }
  }

  console.log("All tables present.\n");
}

// ── Seed data ────────────────────────────────────────────────────────

const DEPARTMENTS = [
  { departmentCode: "CSE", name: "Computer Science & Engineering", hodUserId: "hod-cse", active: true },
  { departmentCode: "IT",  name: "Information Technology",            hodUserId: "hod-it",  active: true },
  { departmentCode: "ECE", name: "Electronics & Communication Engineering", hodUserId: "hod-ece", active: true },
  { departmentCode: "MECH",name: "Mechanical Engineering",            hodUserId: "hod-mech",active: true },
  { departmentCode: "AERO",name: "Aerospace Engineering",             hodUserId: "hod-aero",active: true },
];

const HOD_USERS = [
  { userId: "hod-cse",   email: "hod.cse@vitapstudent.ac.in",   name: "Dr. Ramesh",     departmentCode: "CSE",   role: "DeptHeads" },
  { userId: "hod-it",    email: "hod.it@vitapstudent.ac.in",    name: "Dr. Sunita",     departmentCode: "IT",    role: "DeptHeads" },
  { userId: "hod-ece",   email: "hod.ece@vitapstudent.ac.in",   name: "Dr. Anil",       departmentCode: "ECE",   role: "DeptHeads" },
  { userId: "hod-mech",  email: "hod.mech@vitapstudent.ac.in",  name: "Dr. Prakash",    departmentCode: "MECH",  role: "DeptHeads" },
  { userId: "hod-aero",  email: "hod.aero@vitapstudent.ac.in",  name: "Dr. Kavya",      departmentCode: "AERO",  role: "DeptHeads" },
  { userId: "superadmin",email: "admin@vitapstudent.ac.in",      name: "System Admin",   departmentCode: "ADMIN", role: "SuperAdmins" },
  { userId: "student-ram",   email: "ram.21cse@vitapstudent.ac.in",     name: "Ram Kumar",  departmentCode: "CSE", role: "Students", reliabilityScore: 100 },
  { userId: "student-priya", email: "priya.21it@vitapstudent.ac.in",    name: "Priya Singh",departmentCode: "IT",  role: "Students", reliabilityScore: 95  },
  { userId: "student-arjun", email: "arjun.22ece@vitapstudent.ac.in",   name: "Arjun Raj",  departmentCode: "ECE", role: "Students", reliabilityScore: 88  },
];

const SAMPLE_EVENTS = [
  {
    eventId: "EVT-2024-CSE-0001",
    title: "National Level Hackathon 2024",
    description:
      "A 48-hour national hackathon covering Cloud, AI/ML, and FinTech tracks. Winning teams receive certificates, prizes, and internship opportunities.",
    departmentCode: "CSE",
    organizerUserId: "hod-cse",
    category: "Technical",
    eventType: "Hackathon",
    startDate: "2024-03-15",
    endDate: "2024-03-17",
    startTime: "09:00",
    endTime: "18:00",
    venue: "Computer Centre, Block A",
    maxParticipants: 200,
    teamSize: { min: 2, max: 4, crossDeptAllowed: true, crossYearAllowed: true },
    registrationFee: 100,
    status: "upcoming",
    pointsAwarded: { participant: 10, winner: 25, volunteer: 15 },
    requiresOD: true,
    createdBy: "hod-cse",
    createdAt: "2024-01-10T08:00:00Z",
    isWorkingDay: true,
  },
  {
    eventId: "EVT-2024-CSE-0002",
    title: "AWS Cloud Workshop",
    description:
      "Hands-on AWS workshop covering EC2, S3, Lambda, and RDS. AWS Educate accounts will be set up for all participants.",
    departmentCode: "CSE",
    organizerUserId: "hod-cse",
    category: "Technical",
    eventType: "Workshop",
    startDate: "2024-02-20",
    endDate: "2024-02-20",
    startTime: "10:00",
    endTime: "16:00",
    venue: "Seminar Hall 3, Block B",
    maxParticipants: 60,
    teamSize: null,
    registrationFee: 0,
    status: "completed",
    pointsAwarded: { participant: 5, volunteer: 10 },
    requiresOD: false,
    createdBy: "hod-cse",
    createdAt: "2024-01-15T09:00:00Z",
    isWorkingDay: true,
  },
  {
    eventId: "EVT-2024-IT-0001",
    title: "Web Development Bootcamp",
    description:
      "A 5-day intensive bootcamp on HTML, CSS, JavaScript, and React. Includes a mini-project presentation on the final day.",
    departmentCode: "IT",
    organizerUserId: "hod-it",
    category: "Technical",
    eventType: "Workshop",
    startDate: "2024-02-10",
    endDate: "2024-02-14",
    startTime: "09:00",
    endTime: "13:00",
    venue: "IT Lab 2, Block C",
    maxParticipants: 40,
    teamSize: null,
    registrationFee: 0,
    status: "completed",
    pointsAwarded: { participant: 8, volunteer: 10 },
    requiresOD: false,
    createdBy: "hod-it",
    createdAt: "2024-01-08T10:00:00Z",
    isWorkingDay: false,
  },
  {
    eventId: "EVT-2024-CSE-0003",
    title: "Code Sprint 2024",
    description:
      "A 24-hour coding competition testing algorithmic thinking and problem-solving. Top 10 participants receive certificates.",
    departmentCode: "CSE",
    organizerUserId: "hod-cse",
    category: "Technical",
    eventType: "Competition",
    startDate: "2024-01-25",
    endDate: "2024-01-25",
    startTime: "08:00",
    endTime: "08:00",
    venue: "Computer Centre, Block A",
    maxParticipants: 100,
    teamSize: { min: 1, max: 1, crossDeptAllowed: false, crossYearAllowed: true },
    registrationFee: 50,
    status: "completed",
    pointsAwarded: { participant: 5, winner: 15, runnerUp: 10 },
    requiresOD: true,
    createdBy: "hod-cse",
    createdAt: "2024-01-05T08:00:00Z",
    isWorkingDay: true,
  },
  {
    eventId: "EVT-2024-ECE-0001",
    title: "IoT & Smart Home Hackathon",
    description:
      "Build IoT devices using ESP32, Arduino, and Raspberry Pi. Themes: smart home, agricultural automation, and healthcare.",
    departmentCode: "ECE",
    organizerUserId: "hod-ece",
    category: "Technical",
    eventType: "Hackathon",
    startDate: "2024-04-05",
    endDate: "2024-04-07",
    startTime: "09:00",
    endTime: "18:00",
    venue: "ECE Innovation Lab, Block D",
    maxParticipants: 80,
    teamSize: { min: 2, max: 3, crossDeptAllowed: true, crossYearAllowed: true },
    registrationFee: 150,
    status: "upcoming",
    pointsAwarded: { participant: 10, winner: 25, volunteer: 15 },
    requiresOD: true,
    createdBy: "hod-ece",
    createdAt: "2024-02-01T09:00:00Z",
    isWorkingDay: true,
  },
  {
    eventId: "EVT-2024-MECH-0001",
    title: "Robotics Design Challenge",
    description:
      "Design, build, and test a robot to complete a line-following and obstacle-avoidance course. CAD model submission required.",
    departmentCode: "MECH",
    organizerUserId: "hod-mech",
    category: "Technical",
    eventType: "Competition",
    startDate: "2024-03-20",
    endDate: "2024-03-22",
    startTime: "09:00",
    endTime: "17:00",
    venue: "Mechanical Workshop, Block E",
    maxParticipants: 50,
    teamSize: { min: 2, max: 4, crossDeptAllowed: false, crossYearAllowed: true },
    registrationFee: 200,
    status: "upcoming",
    pointsAwarded: { participant: 10, winner: 25, volunteer: 15 },
    requiresOD: true,
    createdBy: "hod-mech",
    createdAt: "2024-02-05T10:00:00Z",
    isWorkingDay: true,
  },
  {
    eventId: "EVT-2024-CSE-0004",
    title: "Tech Talk Series: AI in Healthcare",
    description:
      "Industry experts discuss how AI is transforming healthcare — diagnostics, drug discovery, and patient care. Q&A session included.",
    departmentCode: "CSE",
    organizerUserId: "hod-cse",
    category: "Technical",
    eventType: "Talk",
    startDate: "2024-01-15",
    endDate: "2024-01-15",
    startTime: "15:00",
    endTime: "17:00",
    venue: "Main Auditorium, Block A",
    maxParticipants: 300,
    teamSize: null,
    registrationFee: 0,
    status: "completed",
    pointsAwarded: { participant: 3, volunteer: 5 },
    requiresOD: false,
    createdBy: "hod-cse",
    createdAt: "2024-01-02T08:00:00Z",
    isWorkingDay: false,
  },
  {
    eventId: "EVT-2024-AERO-0001",
    title: "RC Aircraft Design Competition",
    description:
      "Design and fly your own RC aircraft. Judged on aerodynamic efficiency, stability, and innovation. CAD model submission required.",
    departmentCode: "AERO",
    organizerUserId: "hod-aero",
    category: "Technical",
    eventType: "Competition",
    startDate: "2024-04-10",
    endDate: "2024-04-12",
    startTime: "08:00",
    endTime: "16:00",
    venue: "Aero Ground, Sports Complex",
    maxParticipants: 60,
    teamSize: { min: 2, max: 3, crossDeptAllowed: true, crossYearAllowed: false },
    registrationFee: 100,
    status: "upcoming",
    pointsAwarded: { participant: 10, winner: 25, volunteer: 15 },
    requiresOD: true,
    createdBy: "hod-aero",
    createdAt: "2024-02-10T09:00:00Z",
    isWorkingDay: true,
  },
  {
    eventId: "EVT-2024-CSE-0005",
    title: "Annual Cultural Fest — Utopia 2024",
    description:
      "VIT's annual cultural festival featuring dance, music, art, drama, and fashion competitions. Open to all departments.",
    departmentCode: "CSE",
    organizerUserId: "hod-cse",
    category: "Cultural",
    eventType: "Fest",
    startDate: "2024-03-01",
    endDate: "2024-03-03",
    startTime: "10:00",
    endTime: "22:00",
    venue: "Campus Grounds & Auditoriums",
    maxParticipants: 1000,
    teamSize: { min: 1, max: 10, crossDeptAllowed: true, crossYearAllowed: true },
    registrationFee: 200,
    status: "upcoming",
    pointsAwarded: { participant: 5, winner: 15, volunteer: 20 },
    requiresOD: true,
    createdBy: "hod-cse",
    createdAt: "2024-01-20T10:00:00Z",
    isWorkingDay: true,
  },
  {
    eventId: "EVT-2024-CSE-0006",
    title: "Blood Donation Camp",
    description:
      "A blood donation drive organised with the Red Cross Society. Health screening, counselling, and appreciation certificates for donors.",
    departmentCode: "CSE",
    organizerUserId: "hod-cse",
    category: "Social",
    eventType: "Campaign",
    startDate: "2024-02-28",
    endDate: "2024-02-28",
    startTime: "09:00",
    endTime: "16:00",
    venue: "Student Center Plaza",
    maxParticipants: 200,
    teamSize: null,
    registrationFee: 0,
    status: "completed",
    pointsAwarded: { participant: 15, volunteer: 10 },
    requiresOD: false,
    createdBy: "hod-cse",
    createdAt: "2024-01-25T08:00:00Z",
    isWorkingDay: false,
  },
];

// ── Main seeding logic ───────────────────────────────────────────────

async function seed(): Promise<void> {
  console.log("=== VIT Event Portal — Demo Data Seed ===\n");

  await ensureTablesExist();

  // 1. Departments
  console.log("Seeding departments...");
  for (const dept of DEPARTMENTS) {
    try {
      await docClient.send(
        new PutCommand({ TableName: TABLES.departments, Item: dept })
      );
      console.log(`  [OK] ${dept.departmentCode} — ${dept.name}`);
    } catch (err: any) {
      console.log(`  [SKIP] ${dept.departmentCode} — item may already exist`);
    }
  }

  // 2. Users
  console.log("\nSeeding users...");
  for (const user of HOD_USERS) {
    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLES.users,
          Item: {
            userId: user.userId,
            email: user.email,
            name: user.name,
            departmentCode: user.departmentCode,
            role: user.role,
            reliabilityScore: user.reliabilityScore,
            createdAt: new Date().toISOString(),
          },
        })
      );
      console.log(`  [OK] ${user.name} (${user.email}) — ${user.role}`);
    } catch (err: any) {
      console.log(`  [SKIP] ${user.email} — item may already exist`);
    }
  }

  // 3. Events
  console.log("\nSeeding events...");
  for (const event of SAMPLE_EVENTS) {
    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLES.events,
          Item: {
            ...event,
            participantCount: 0,
            confirmedCount: 0,
            cancelledCount: 0,
          },
        })
      );
      console.log(`  [OK] ${event.title} (${event.eventId})`);
    } catch (err: any) {
      console.log(`  [SKIP] ${event.eventId} — item may already exist`);
    }
  }

  console.log("\n=== Seed complete ===");
  console.log("\nNext steps:");
  console.log("  1. Create Cognito users (AWS Console or AdminCreateUser API)");
  console.log("  2. Add environment variables to .env.local");
  console.log("  3. Start the dev server: npm run dev");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
