#!/usr/bin/env python3
"""
Gradescope API Server
A FastAPI wrapper around the unofficial gradescopeapi library
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import os
import ssl
from dotenv import load_dotenv

# Import the Gradescope API
from gradescopeapi.classes.connection import GSConnection

# Fix SSL certificate issue
import certifi
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
os.environ['SSL_CERT_FILE'] = certifi.where()

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Gradescope API Server",
    description="Unofficial Gradescope API wrapper",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class LoginRequest(BaseModel):
    email: str
    password: str

class CourseResponse(BaseModel):
    id: str
    name: str
    short_name: str
    role: str
    url: str

class AssignmentResponse(BaseModel):
    id: str
    name: str
    due_date: Optional[str]
    total_points: Optional[float]
    url: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str

# Global connection (in production, you'd want proper session management)
gs_connection: Optional[GSConnection] = None

def get_connection() -> GSConnection:
    """Get or create a Gradescope connection"""
    global gs_connection
    if gs_connection is None:
        raise HTTPException(status_code=401, detail="Not logged in. Please login first.")
    return gs_connection

@app.post("/login")
async def login(request: LoginRequest):
    """Login to Gradescope"""
    global gs_connection
    try:
        gs_connection = GSConnection()
        gs_connection.login(request.email, request.password)
        return {"message": "Login successful", "email": request.email}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Login failed: {str(e)}")

@app.post("/logout")
async def logout():
    """Logout from Gradescope"""
    global gs_connection
    gs_connection = None
    return {"message": "Logout successful"}

@app.get("/courses", response_model=List[CourseResponse])
async def get_courses():
    """Get all courses for the logged-in user"""
    connection = get_connection()
    try:
        courses = connection.account.get_courses()
        
        # Flatten and format courses
        all_courses = []
        
        # Add instructor courses
        if "instructor" in courses:
            for course in courses["instructor"]:
                all_courses.append(CourseResponse(
                    id=course.get("id", ""),
                    name=course.get("name", ""),
                    short_name=course.get("short_name", ""),
                    role="instructor",
                    url=course.get("url", "")
                ))
        
        # Add student courses
        if "student" in courses:
            for course in courses["student"]:
                all_courses.append(CourseResponse(
                    id=course.get("id", ""),
                    name=course.get("name", ""),
                    short_name=course.get("short_name", ""),
                    role="student",
                    url=course.get("url", "")
                ))
        
        return all_courses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch courses: {str(e)}")

@app.get("/courses/{course_id}/assignments", response_model=List[AssignmentResponse])
async def get_assignments(course_id: str):
    """Get all assignments for a specific course"""
    connection = get_connection()
    try:
        assignments = connection.account.get_assignments(course_id)
        
        formatted_assignments = []
        for assignment in assignments:
            formatted_assignments.append(AssignmentResponse(
                id=assignment.get("id", ""),
                name=assignment.get("name", ""),
                due_date=assignment.get("due_date"),
                total_points=assignment.get("total_points"),
                url=assignment.get("url", "")
            ))
        
        return formatted_assignments
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch assignments: {str(e)}")

@app.get("/courses/{course_id}/users", response_model=List[UserResponse])
async def get_course_users(course_id: str):
    """Get all users (students/instructors) for a specific course"""
    connection = get_connection()
    try:
        users = connection.account.get_course_users(course_id)
        
        formatted_users = []
        for user in users:
            formatted_users.append(UserResponse(
                id=user.get("id", ""),
                name=user.get("name", ""),
                email=user.get("email", ""),
                role=user.get("role", "")
            ))
        
        return formatted_users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch course users: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Gradescope API Server"}

if __name__ == "__main__":
    # Get port from environment or default to 8001
    port = int(os.getenv("GRADESCOPE_API_PORT", 8001))
    
    print(f"Starting Gradescope API Server on port {port}")
    print(f"API documentation available at: http://localhost:{port}/docs")
    
    uvicorn.run(
        "gradescope-server:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
