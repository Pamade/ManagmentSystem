require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');
const authRoutes = require('./routing/auth');
const userRoutes = require('./routing/user');
const projectRoutes = require('./routing/project');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);

initDatabase().then(() => {
    app.listen(PORT);
}).catch(err => {
    process.exit(1);
});