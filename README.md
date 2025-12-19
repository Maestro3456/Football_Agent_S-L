# Football Agent Sierra Leone — Frontend & Backend System

## Course Information
-Web Programming Techniques
-BBIT2101
-Limkokwing University of Creative Technology
-Mr Mohamed Vandi

## Student Information
-Clement Leonard Bindi
-905004007

## project Overview
This backend implements a simple user management system using **Express.js** and **SQLite**.

## ✅ Features
- User roles: Admin, Player, Agent, Club Manager  
- SQLite database  
- API endpoints for managing users  
- Sample data included  

## 📌 Setup Instructions

### 1. Install Dependencies
```
npm install
```

### 2. Build the Database
```
sqlite3 database.db < schema.sql
```

### 3. Start Server
```
node server.js
```

Server runs on **http://localhost:3000**

## 📌 API Endpoints

### Get All Users
```
GET /users
```

### Add User
'''
POST /users
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "role": "player",
  "password_hash": "secret"
}
'''

## 📌 Files Included
- schema.sql  
- server.js  
- package.json  
- README.md

This backend is suitable for Assignment Part 2 submission, including GitHub upload.
