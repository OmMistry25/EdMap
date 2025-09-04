# PrairieLearn Integration Troubleshooting Guide

## Common Issues and Solutions

### 1. "Invalid URL or Token" Error

This error typically occurs due to one of these issues:

#### **URL Format Problems**
- **Problem**: PrairieLearn URLs must end with `/pl` for API calls
- **Solution**: The system automatically normalizes URLs, but ensure you're using the correct base URL
- **Examples**:
  - ✅ `https://prairielearn.illinois.edu` (will be normalized to `https://prairielearn.illinois.edu/pl`)
  - ✅ `https://your-instance.edu/pl` (already correct)
  - ❌ `https://your-instance.edu/api` (incorrect)

#### **Token Issues**
- **Problem**: Access token is invalid or expired
- **Solution**: 
  1. Generate a new access token from your PrairieLearn instance
  2. Ensure you have the correct permissions (instructor or student access)
  3. Check that the token hasn't expired

#### **Instance-Specific Issues**
- **Problem**: Some PrairieLearn instances may have different API configurations
- **Solution**: Use the test endpoint first to verify connectivity

### 2. Testing Your Connection

Before attempting to connect, test your PrairieLearn instance:

#### **Using the Web Test Endpoint**
1. Go to `/api/integrations/prairielearn/test`
2. Enter your PrairieLearn URL and access token
3. Review the results for each endpoint

#### **Using the Command Line Test Script**
```bash
node scripts/test-prairielearn.js <your-url> <your-token>
```

Example:
```bash
node scripts/test-prairielearn.js https://prairielearn.illinois.edu your_token_here
```

### 3. Expected API Responses

#### **Successful Course Instances Response**
```json
[
  {
    "id": "12345",
    "short_name": "CS101",
    "long_name": "Introduction to Computer Science",
    "institution": {"short_name": "UIUC"},
    "display_timezone": "America/Chicago"
  }
]
```

#### **Successful Assessments Response**
```json
[
  {
    "id": "67890",
    "title": "Homework 1",
    "type": "Homework",
    "due_date": "2024-12-15T23:59:00Z",
    "points": 100
  }
]
```

### 4. Debugging Steps

#### **Step 1: Verify URL Format**
- Ensure your PrairieLearn URL is correct
- The system will automatically append `/pl` if needed

#### **Step 2: Test Token Validity**
- Use the test endpoint to verify your token works
- Check that you can access the course instances endpoint

#### **Step 3: Check API Endpoints**
- Verify that `/api/v1/course_instances` returns data
- Check that you have access to the courses you're trying to sync

#### **Step 4: Review Error Logs**
- Check the browser console for detailed error messages
- Look for specific HTTP status codes and error responses

### 5. Common HTTP Status Codes

- **200**: Success - API call worked
- **401**: Unauthorized - Invalid or expired token
- **403**: Forbidden - Token valid but insufficient permissions
- **404**: Not Found - API endpoint doesn't exist
- **500**: Server Error - PrairieLearn instance issue

### 6. Getting Help

If you're still experiencing issues:

1. **Check the logs**: Look for detailed error messages in the console
2. **Test manually**: Use the test script to isolate the problem
3. **Verify credentials**: Ensure your token and URL are correct
4. **Check permissions**: Verify you have access to the courses you're trying to sync

### 7. PrairieLearn Instance Variations

Different PrairieLearn instances may have:
- Different API versions
- Custom authentication methods
- Modified endpoint structures
- Different permission models

If you're using a custom PrairieLearn instance, you may need to:
- Contact your system administrator
- Check instance-specific documentation
- Verify API endpoint availability

## Quick Fix Checklist

- [ ] URL ends with `/pl` or can be normalized
- [ ] Access token is valid and not expired
- [ ] You have permissions to access the courses
- [ ] API endpoints are available on your instance
- [ ] Network/firewall allows the connection
- [ ] PrairieLearn instance is accessible from your location
