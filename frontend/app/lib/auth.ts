// Get API key from environment variable
export const getApiKey = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set");
  }
  return apiKey;
};

// Helper function to create headers with authentication
export const createAuthHeaders = (): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getApiKey()}`,
});

// Helper function to create headers with authentication and custom content type
export const createAuthHeadersWithContentType = (
  contentType: string = "application/json"
): HeadersInit => ({
  "Content-Type": contentType,
  Authorization: `Bearer ${getApiKey()}`,
});

// Helper function to create headers with authentication and accept header
export const createAuthHeadersWithAccept = (
  accept: string = "application/json"
): HeadersInit => ({
  Accept: accept,
  "Content-Type": "application/json",
  Authorization: `Bearer ${getApiKey()}`,
});
