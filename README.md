Orbit--SupportFlow

A focused customer support ticketing desk built for the "AI Factory 2.0" hackathon (Task D). Customers submit tickets, agents triage and resolve them, and status/message updates appear in real time.

Live Demo
Frontend: https://orbit-support-flow-final-hackathon.vercel.app
Backend API: https://orbit-support-flow-final-hackathon.onrender.com/api

Note: the backend is hosted on Render's free tier — the first request after a period of inactivity may take 30-60 seconds to wake up.

Demo Credentials
Role	           Email  	     Password
Support   (Agent	agent@orbit.com)  	(agent123)
Customer	Create your own via the Sign Up page with any email	—

Agent access is granted automatically at signup to any email listed in the backend's AGENT_EMAILS environment variable. Any other email that signs up is created as a Customer.

Tech Stack
Frontend: React.js (JavaScript), Tailwind CSS, Framer Motion
Backend: Node.js, Express.js
Database: MongoDB with Mongoose
Real-time: Socket.IO
File uploads: Cloudinary (via multer + multer-storage-cloudinary)
Auth: Email/password with bcrypt password hashing and JWT sessions
Core Features
Email + password authentication with role-based access (Customer / Agent), role assigned automatically by email at signup
Customer ticket creation (subject, description, optional category) with an auto-generated unique ticket number (TCK-YYYYMMDD-XXXX)
Ticket status workflow: New → Assigned → In Progress → Resolved, with a Reopen action for resolved tickets
Manual agent triage: agents set/confirm category, priority, and a short summary before a ticket can move to "In Progress"
Persistent conversation thread per ticket between customer and assigned agent
Real-time updates via Socket.IO: status changes and new messages appear without a manual refresh
Agent dashboard with live ticket counts (Total, Unassigned, In Progress, Resolved) pulled from the database
Profile page (shared component for both roles) with Cloudinary-backed avatar upload
Resolution notes required before a ticket can be marked Resolved
Responsive UI with loading, empty, and error states throughout
Business Rules Enforced (server-side)
Customers can only view/access their own tickets
Agents can only update tickets assigned to them
A ticket cannot be set to Resolved without a resolution note
A Resolved ticket cannot be modified through the normal workflow — only the Reopen action can move it back to In Progress
Category and priority values are validated against fixed enums before being saved
Project Structure
/Frontend
  /src
    /pages        → route-level views (Login/Signup, Dashboard, Ticket Detail, etc.)
    /components   → reusable UI components
    /context      → AuthContext (user/session state)
    /api          → central axios instance (src/api/axios.js)
    /hooks        → shared hooks
    /utils        → helper functions

/Backend
  /models         → Mongoose schemas (User, Ticket)
  /routes         → Express route definitions
  /controllers    → request handlers / business logic
  /middleware     → auth middleware, multer upload middleware
  /config         → db.js (MongoDB connection), cloudinary.js
  server.js       → app entry point, CORS + Socket.IO setup
Running Locally
Backend
bash
cd Backend
npm install

Create a .env file in /Backend with:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
AGENT_EMAILS=agent@orbit.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
bash
npm start

Server runs on http://localhost:5000, connecting to MongoDB automatically.

Frontend
bash
cd Frontend
npm install

Create a .env file in /Frontend with:

VITE_API_URL=http://localhost:5000/api
bash
npm run dev

App runs on http://localhost:5173 (Vite default).

API Overview
Method	Endpoint	Description
POST	/api/auth/register	Create account (role auto-assigned by email)
POST	/api/auth/login	Log in, returns JWT + user info
GET	/api/tickets/mine	Customer's own tickets
GET	/api/tickets/unassigned	Unassigned ticket pool (agent)
GET	/api/tickets/assigned	Tickets assigned to the logged-in agent
GET	/api/tickets/:id	Single ticket detail
POST	/api/tickets	Create a new ticket (customer)
PATCH	/api/tickets/:id/assign	Agent claims an unassigned ticket
PATCH	/api/tickets/:id/classify	Agent sets category/priority/summary
PATCH	/api/tickets/:id/status	Update ticket status
PATCH	/api/tickets/:id/reopen	Reopen a resolved ticket
POST	/api/tickets/:id/messages	Add a message to the conversation
GET	/api/tickets/stats	Dashboard statistics (agent)
POST	/api/users/profile-image	Upload/update profile picture

(A full Postman collection can be exported from the routes above if required for submission.)

Deployment
Frontend: Vercel (auto-deploys from the main branch)
Backend: Render (auto-deploys from the main branch)
Database: MongoDB Atlas (free tier)
Known Simplifications (given hackathon time constraints)
No admin role — the agent dashboard already covers ticket visibility and basic stats, which met the MVP requirement without adding a separate role
No automatic ticket assignment — agents pick up tickets from a shared unassigned pool ("Assign to me")
Agent accounts are provisioned via an email allowlist (AGENT_EMAILS) rather than an admin invite flow
