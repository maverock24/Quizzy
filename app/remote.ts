export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const remoteAddress = searchParams.get('remoteAddress');
    const response = await fetch(remoteAddress!);
    const data = await response.json();
    console.log('data', data);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching remote quiz:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch remote quiz' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
