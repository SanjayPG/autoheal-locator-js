#!/usr/bin/env node
/**
 * Test API Keys - Verify your AI provider API keys are valid
 */

require('dotenv').config();
const axios = require('axios');

async function testGeminiKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('❌ GEMINI_API_KEY not found in environment variables');
    return false;
  }

  console.log('🔍 Testing Gemini API Key...');
  console.log(`   Key: ${apiKey.substring(0, 10)}...`);

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{ text: 'Say "API key is valid" in JSON format with key "status"' }]
        }]
      },
      { timeout: 10000 }
    );

    console.log('✅ Gemini API Key is VALID');
    console.log(`   Tokens used: ${response.data.usageMetadata?.totalTokenCount || 'N/A'}`);
    return true;
  } catch (error) {
    console.log('❌ Gemini API Key is INVALID');
    if (error.response?.status === 400) {
      console.log('   Error: Invalid API key format or key not recognized');
    } else if (error.response?.status === 429) {
      console.log('   Error: Rate limit exceeded (key is valid but quota reached)');
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function testGroqKey() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.log('❌ GROQ_API_KEY not found in environment variables');
    return false;
  }

  console.log('\n🔍 Testing Groq API Key...');
  console.log(`   Key: ${apiKey.substring(0, 10)}...`);

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: 'Say "API key is valid"' }
        ],
        max_tokens: 50
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Groq API Key is VALID');
    console.log(`   Tokens used: ${response.data.usage?.total_tokens || 'N/A'}`);
    return true;
  } catch (error) {
    console.log('❌ Groq API Key is INVALID');
    if (error.response?.status === 401) {
      console.log('   Error: Unauthorized - Invalid API key');
    } else if (error.response?.status === 429) {
      console.log('   Error: Rate limit exceeded (key is valid but quota reached)');
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function main() {
  console.log('🔑 API Key Validator');
  console.log('='.repeat(50));

  await testGeminiKey();
  await testGroqKey();

  console.log('\n' + '='.repeat(50));
  console.log('💡 Tip: Add missing keys to your .env file');
}

main().catch(console.error);
