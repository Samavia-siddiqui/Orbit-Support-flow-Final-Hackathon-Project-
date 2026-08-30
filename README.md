**Orbit__SupportFlow**

Customer support ticketing desk — customers raise tickets, agents triage and resolve them, updates appear live. Built for AI Factory 2.0 Hackathon (Task D).

🔗 Live Links
Frontend: https://orbit-support-flow-final-hackathon.vercel.app
Backend: https://orbit-support-flow-final-hackathon.onrender.com/api

(Backend is on Render's free tier — first load may take ~30-60s to wake up.)

🔑 Demo Credentials
Agent: agent@orbit.com / agent123
Customer: Sign up with any other email
🛠 Tech Stack
React.js (JS) + Tailwind + Framer Motion
Node.js + Express.js
MongoDB + Mongoose
Socket.IO (real-time)
Cloudinary (profile images)
JWT + bcrypt (auth)
✅ Features
Email/password auth, role auto-assigned by email (Customer / Agent)
Ticket creation with auto-generated ticket number (TCK-YYYYMMDD-XXXX)
Status flow: New → Assigned → In Progress → Resolved (+ Reopen)
Manual agent triage: category, priority, summary set before "In Progress"
Live conversation thread per ticket
Real-time status/message updates (Socket.IO, no refresh needed)
Agent dashboard with live stats (Total / Unassigned / In Progress / Resolved)
Profile page with avatar upload (Cloudinary)
Resolution note required to mark a ticket Resolved
Responsive UI with loading / empty / error states
🔒 Business Rules
Customers see only their own tickets
Agents update only tickets assigned to them
No Resolve without a resolution note
Resolved tickets are locked — only Reopen unlocks them
Category/priority validated against fixed enums server-side
📁 Structure
/Frontend/src   → pages, components, context, api, hooks, utils
/Backend        → models, routes, controllers, middleware, config, server.js
▶ Run Locally

Backend

bash
cd Backend
npm install
npm start

.env needed: PORT, MONGO_URI, JWT_SECRET, FRONTEND_URL, AGENT_EMAILS, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

Frontend

bash
cd Frontend
npm install
npm run dev

.env needed: VITE_API_URL=http://localhost:5000/api

📡 API Endpoints
Method	Endpoint	Description
POST	/api/auth/register	Sign up (role auto-assigned)
POST	/api/auth/login	Log in
GET	/api/tickets/mine	Customer's tickets
GET	/api/tickets/unassigned	Unassigned pool (agent)
GET	/api/tickets/assigned	Agent's assigned tickets
GET	/api/tickets/:id	Ticket detail
POST	/api/tickets	Create ticket
PATCH	/api/tickets/:id/assign	Claim a ticket
PATCH	/api/tickets/:id/classify	Set category/priority/summary
PATCH	/api/tickets/:id/status	Update status
PATCH	/api/tickets/:id/reopen	Reopen resolved ticket
POST	/api/tickets/:id/messages	Send message
GET	/api/tickets/stats	Dashboard stats
POST	/api/users/profile-image	Upload avatar
⚙️ Deployment

Frontend → Vercel · Backend → Render · Database → MongoDB Atlas (free tier)

📝 Notes / Simplifications
No separate Admin role — Agent dashboard covers visibility + stats
No auto-assignment — agents self-pick from an unassigned pool
Agent accounts provisioned via email allowlist (AGENT_EMAILS), not an invite system
Content

HACKATHON TASK - D MODERN WEB & APP DEVELOPMENT - ADVANCE AI FACTORY 2.0 SUPPORTFLOW Challenge: Build a focused AI-assisted customer support desk for managing support tickets. Core idea: Customer submits ticket → AI triages → Agent receives → Agent responds → Resolve 1. Problem Statement Supp

PASTED

import React, { useState, useEffect } from "react"; import { motion } from "framer-motion"; import { Orbit, Eye, EyeOff, Mail, Lock, User } from "lucide-react"; import "./signup or login.css"; import { useAuth } from "./context/AuthContext"; import api from "./api/axios"; import Swal from 'swe

PASTED

el CLI 59.10.0 (Node.js 24.14.0) Directory ~\OneDrive\Desktop\SupportFlow\Frontend Team samavia-siddiquis-projects ? Which project? Search all projects ? Which project? (27 projects) ❯ orbit-support-flow-final-hackathon-project project-showcaser-app samavia-siddi

PASTED

Orbit--SupportFlow A focused customer support ticketing desk built for the "AI Factory 2.0" hackathon (Task D). Customers submit tickets, agents triage and resolve them, and status/message updates appear in real time. Live Demo Frontend: https://orbit-support-flow-final-hackathon.vercel.app

PASTED
