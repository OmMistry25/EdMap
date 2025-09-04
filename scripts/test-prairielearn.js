#!/usr/bin/env node

/**
 * Simple PrairieLearn API test script
 * Usage: node scripts/test-prairielearn.js <url> <token>
 */

const fetch = require('node-fetch');

async function testPrairieLearn(url, token) {
  console.log('=== PrairieLearn API Test ===');
  console.log('URL:', url);
  console.log('Token length:', token.length);
  
  // Normalize URL
  let normalizedUrl = url;
  if (!normalizedUrl.endsWith('/pl')) {
    normalizedUrl = normalizedUrl.endsWith('/') ? `${normalizedUrl}pl` : `${normalizedUrl}/pl`;
  }
  console.log('Normalized URL:', normalizedUrl);
  
  const endpoints = [
    '/api/v1/course_instances',
    '/api/v1/courses',
    '/api/v1/user'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n--- Testing ${endpoint} ---`);
      const fullUrl = `${normalizedUrl}${endpoint}`;
      console.log('Full URL:', fullUrl);
      
      const response = await fetch(fullUrl, {
        headers: {
          'Private-Token': token,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Status:', response.status, response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log('Response data:', JSON.stringify(data, null, 2));
        } catch (e) {
          console.log('Failed to parse JSON response');
          const text = await response.text();
          console.log('Response text:', text.substring(0, 200));
        }
      } else {
        try {
          const errorText = await response.text();
          console.log('Error response:', errorText.substring(0, 200));
        } catch (e) {
          console.log('Could not read error response');
        }
      }
    } catch (error) {
      console.log(`Error testing ${endpoint}:`, error.message);
    }
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/test-prairielearn.js <url> <token>');
  console.log('Example: node scripts/test-prairielearn.js https://prairielearn.illinois.edu your_token_here');
  process.exit(1);
}

const [url, token] = args;
testPrairieLearn(url, token).catch(console.error);
