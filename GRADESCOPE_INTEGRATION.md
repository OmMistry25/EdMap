# Gradescope Integration

This project integrates with Gradescope using the unofficial [gradescope-api](https://github.com/nyuoss/gradescope-api) Python library.

## Architecture

The integration uses a **two-tier approach**:

1. **Python FastAPI Server** (`gradescope-server.py`) - Wraps the unofficial Gradescope API
2. **Next.js API Routes** - Forward requests to the Python server

This approach allows us to:
- Use the Python library without Node.js compatibility issues
- Maintain clean separation of concerns
- Easily update the Gradescope integration independently

## Setup

### 1. Install Dependencies

```bash
# Create virtual environment (outside project directory to avoid Turbopack issues)
cd ..
python3 -m venv gradescope-api-env

# Activate environment
source gradescope-api-env/bin/activate
cd EdMap

# Install packages
pip install gradescopeapi uvicorn python-dotenv
```

### 2. Start the Gradescope API Server

```bash
# Option 1: Use the startup script
./start-gradescope-server.sh

# Option 2: Manual start
source gradescope-api-env/bin/activate
python gradescope-server.py
```

The server will start on port 8001 by default.

### 3. Configure Environment Variables

```bash
# .env.local
GRADESCOPE_API_URL=http://localhost:8001
```

## API Endpoints

### Python FastAPI Server (Port 8001)

- `POST /login` - Authenticate with Gradescope
- `POST /logout` - Logout from Gradescope
- `GET /courses` - Get all courses for the user
- `GET /courses/{course_id}/assignments` - Get assignments for a course
- `GET /courses/{course_id}/users` - Get users in a course
- `GET /health` - Health check

### Next.js API Routes

- `POST /api/integrations/gradescope/login` - Forward login to Python server
- `POST /api/integrations/gradescope/logout` - Forward logout to Python server
- `GET /api/integrations/gradescope/courses` - Get courses
- `GET /api/integrations/gradescope/assignments/[courseId]` - Get assignments

## Usage

### 1. Connect Gradescope

1. Navigate to `/connect` in your app
2. Click "Connect Gradescope"
3. Enter your Gradescope email and password
4. Click "Connect"

### 2. Sync Data

1. After connecting, click "Sync Gradescope Data"
2. The system will fetch your courses and assignments
3. Data will be imported into your EdMap dashboard

## Security Notes

- **Credentials are NOT stored permanently** in the database
- **Session-based authentication** - credentials are kept in memory during the session
- **Local API server** - all communication stays on your local machine
- **HTTPS recommended** for production deployments

## Troubleshooting

### Common Issues

1. **Server not starting**
   - Check if port 8001 is available
   - Verify virtual environment is activated
   - Check Python dependencies are installed

2. **Authentication failed**
   - Verify Gradescope credentials
   - Check if 2FA is enabled (may need app password)
   - Ensure Gradescope account is active

3. **No courses found**
   - Verify you have access to courses in Gradescope
   - Check if courses are published/visible
   - Ensure proper role permissions

### Debug Mode

The Python server includes detailed logging. Check the console output for:
- Authentication attempts
- API responses
- Error details

## Production Deployment

For production use:

1. **Secure the Python server** with proper authentication
2. **Use HTTPS** for all communications
3. **Implement proper session management** (Redis, database)
4. **Add rate limiting** to prevent abuse
5. **Monitor server health** and logs

## API Documentation

Visit `http://localhost:8001/docs` when the server is running to see the interactive API documentation.

## Contributing

To extend the integration:

1. **Add new endpoints** to `gradescope-server.py`
2. **Create corresponding Next.js routes** in `src/app/api/integrations/gradescope/`
3. **Update the frontend** to use new functionality
4. **Test thoroughly** with real Gradescope accounts

## License

This integration uses the unofficial gradescope-api library which is MIT licensed.
