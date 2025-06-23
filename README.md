# Project Management System

A full-stack project management application built with React (Vite) and Express, featuring user authentication, project management, and participant collaboration.

## Features

- 🔐 **User Authentication**
  - JWT-based authentication
  - Secure user registration and login
  - Persistent sessions using localStorage

- 📊 **Project Management**
  - Create and manage projects
  - Update project status (pending, active, completed)
  - Edit project details (name, description)
  - View projects grouped by owner

- 👥 **Participant Management**
  - Add/remove project participants
  - Separate views for owned and participated projects
  - Role-based access control (owner/participant)
  - User-friendly participant management interface

- 🎨 **Modern UI**
  - Material-UI components
  - Responsive design
  - Intuitive navigation
  - Clear visual feedback for actions

## Tech Stack

### Frontend
- React (Vite)
- TypeScript
- Material-UI
- React Router
- SCSS for styling

### Backend
- Node.js
- Express
- MongoDB (native driver)
- JWT for authentication

## Project Structure

```
ManagmentSystem/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── hooks/            # Custom React hooks
│   │   └── styles/           # Global styles
│   └── public/               # Static assets
└── server/                   # Backend Express application
    ├── controllers/         # Route controllers
    ├── models/             # Database models
    ├── middleware/         # Express middleware
    └── routing/            # Route definitions
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd ManagmentSystem
\`\`\`

2. Install dependencies:

Frontend:
\`\`\`bash
cd client
npm install
\`\`\`

Backend:
\`\`\`bash
cd server
npm install
\`\`\`

3. Set up environment variables:

Create a \`.env\` file in the server directory:
\`\`\`env
PORT=5000
DB_USER=db_user
DB_PASS=db_pass
JWT_SECRET=your_jwt_secret
\`\`\`

### Running the Application

1. Start the backend server:
\`\`\`bash
cd server
npm start
\`\`\`

2. Start the frontend development server:
\`\`\`bash
cd client
npm run dev
\`\`\`

The application will be available at `http://localhost:5173`

## Usage

1. **Authentication**
   - Register a new account or login with existing credentials
   - JWT token is automatically managed in localStorage

2. **Projects**
   - Create new projects from the home page
   - View your projects in the "My Projects" section
   - Access projects where you're a participant
   - View all available projects in the system

3. **Project Management**
   - Edit project details (name, description) as the owner
   - Update project status (pending, active, completed)
   - Add or remove participants (owner only)
   - View project participants and their roles

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `GET /api/projects/:id/participants` - Get project participants
- `POST /api/projects/:id/participants` - Add participant
- `DELETE /api/projects/:id/participants/:userId` - Remove participant

### Users
- `GET /api/users` - Get available users
- `GET /api/users/me` - Get current user info

## Security

- JWT tokens for authentication
- Password hashing
- Protected routes
- Access control checks
- XSS protection
- CORS configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Material-UI for the component library
- MongoDB for the database
- Express for the backend framework
- React and Vite for the frontend
