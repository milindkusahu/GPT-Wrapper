import axios from "axios";

const OPENAI_API_URL = import.meta.env.VITE_OPENAI_API_URL;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Rate limiting configuration
const MIN_DELAY_BETWEEN_REQUESTS = 3000; // 3 seconds minimum delay
let lastRequestTime = 0;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const calculateDelay = () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  return Math.max(0, MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest);
};

export const chatWithGPT = async (message) => {
  try {
    // Implement delay between requests
    const delay = calculateDelay();
    if (delay > 0) {
      await wait(delay);
    }

    lastRequestTime = Date.now();

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
        temperature: 0.7,
        max_tokens: 150, // Limit response length to help with rate limits
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 429:
          // If we hit rate limit, wait and retry once
          await wait(20000); // Wait 20 seconds before retrying
          try {
            lastRequestTime = Date.now();
            const retryResponse = await axios.post(
              OPENAI_API_URL,
              {
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: message }],
                temperature: 0.7,
                max_tokens: 150,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
              }
            );
            return retryResponse.data.choices[0].message.content;
          } catch (retryError) {
            throw new Error(
              "Rate limit still exceeded. Please try again in a few minutes."
            );
          }
        case 401:
          throw new Error(
            "Invalid API key. Please check your environment variables."
          );
        case 500:
          throw new Error("OpenAI server error. Please try again later.");
        case 503:
          throw new Error(
            "OpenAI service is unavailable. Please try again later."
          );
        default:
          throw new Error(
            `OpenAI API Error: ${
              error.response.data.error?.message || "Unknown error occurred"
            }`
          );
      }
    } else if (error.request) {
      throw new Error(
        "No response from OpenAI. Please check your internet connection."
      );
    } else {
      throw new Error("Error setting up the request: " + error.message);
    }
  }
};
