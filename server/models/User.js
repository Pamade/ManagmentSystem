const bcrypt = require('bcryptjs');
const {getDatabase} = require('../database');

const COLLECTION_NAME = 'users';

class User {
    constructor(name, email, password, projects) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.projects = projects || [];
    }

    async create() {
        try {
            const db = getDatabase();
            const usersCollection = db.collection(COLLECTION_NAME);

            const existingUser = await usersCollection.findOne({ email: this.email });
            
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(this.password, salt);

            const result = await usersCollection.insertOne({
                name: this.name,
                email: this.email,
                password: hashedPassword,
                projects: this.projects,
                created_at: new Date()
            });

            return result.insertedId;
        } catch (error) {
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            const db = getDatabase();
            const usersCollection = db.collection(COLLECTION_NAME);
            return await usersCollection.findOne({ email });
        } catch (error) {
            throw error;
        }
    }

    static async validatePassword(providedPassword, storedPassword) {
        return await bcrypt.compare(providedPassword, storedPassword);
    }
}

module.exports = User;