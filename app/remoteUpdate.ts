// Import necessary types if needed (e.g., from Next.js or your framework)
// import { NextRequest, NextResponse } from 'next/server';

/**
 * NOTE: Remember to configure CORS headers at the server/framework level
 * to allow requests from your Expo web app's origin(s).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const remoteAddress = searchParams.get('remoteAddress');

  if (!remoteAddress) {
    return new Response(
      JSON.stringify({ error: 'Missing remoteAddress parameter' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // --- Security Consideration ---
  // Directly fetching arbitrary URLs provided by query parameters can be a
  // Server-Side Request Forgery (SSRF) risk. In a production environment,
  // you should validate the 'remoteAddress' to ensure it's an allowed URL
  // (e.g., matches a pattern for drive.google.com/uc?).
  // Example (basic validation):
  const allowedPattern = /^https:\/\/drive\.google\.com\/uc\?.*/;
  if (!allowedPattern.test(remoteAddress)) {
    return new Response(JSON.stringify({ error: 'Invalid remoteAddress' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // --- End Security Consideration ---

  console.log('Fetching remote address:', remoteAddress);

  try {
    // Fetch the file from the remote address.
    // fetch automatically handles redirects by default (redirect: 'follow').
    // Be aware: This will NOT handle Google Drive's "virus scan warning" page for large files.
    const externalResponse = await fetch(remoteAddress, {
      // Default redirect: 'follow' is usually fine. Add if needed:
      // redirect: 'follow',
    });

    if (!externalResponse.ok) {
      // Log the specific error from the external fetch
      console.error(
        `Failed to fetch remote resource at ${remoteAddress}: ${externalResponse.status} ${externalResponse.statusText}`
      );
      // Try to read potential error body from the external source if possible
      let errorBody = `Failed to fetch remote resource: ${externalResponse.status} ${externalResponse.statusText}`;
      try {
          const externalErrorText = await externalResponse.text();
          errorBody = `Failed to fetch remote resource (${externalResponse.status}): ${externalErrorText.substring(0, 200)}`; // Limit error length
      } catch (_) { /* Ignore if reading body fails */ }

      return new Response(
        JSON.stringify({ error: errorBody }),
        {
          // Use the status from the failed external response
          status: externalResponse.status < 500 ? 400 : 502, // Map client errors to 400, server errors to 502 (Bad Gateway)
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the original Content-Type, default to application/octet-stream
    const contentType = externalResponse.headers.get('content-type') || 'application/octet-stream';

    // Get the original Content-Length if available
    const contentLength = externalResponse.headers.get('content-length');

    // Get the response body as a Blob or ReadableStream for efficient streaming
    const body = externalResponse.body; // ReadableStream

    if (!body) {
       throw new Error("Response body from remote address is null");
    }

    // Prepare response headers, passing through content type and length
    const responseHeaders = new Headers({
      'Content-Type': contentType,
    });
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }
    // Optional: Add Content-Disposition if you want to suggest a filename
    // const filename = remoteAddress.split('/').pop()?.split('?')[0] || 'downloaded-file';
    // responseHeaders.set('Content-Disposition', `attachment; filename="${filename}"`);


    // Stream the response body directly back to the client
    return new Response(body, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error) {
    // Handle network errors during the fetch itself or other unexpected errors
    console.error('Error fetching or processing remote resource:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: `Internal server error: ${errorMessage}` }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}