import https from 'https';

function runRefresh({domain, token}) {
  console.log('running refresh with', token);
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({paths: ['/abcd'], domain});
    let data = '';
    const req = https.request(
      {
        hostname: 'api.netlify.com',
        port: 443,
        path: '/api/v1/sites/40ce9daa-744e-471e-ba5c-afa7cbac4c42/refresh_on_demand_builders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': body.length,
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(JSON.parse(data));
        });
      },
    );
    req.write(body);
    req.end();
  });
}

// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
const handler = async (event, context) => {
  console.log('event', event);
  console.log('context', context);
  try {
    const json = await runRefresh({
      domain: event.headers.host,
      token: context.clientContext.custom.odb_refresh_hooks,
    });
    console.log('res', json);
    const subject = event.queryStringParameters.name || 'World';
    return {
      statusCode: 200,
      body: JSON.stringify(
        {message: `Hello ${subject}`, refreshResult: json},
        null,
        2,
      ),
      // // more keys you can return:
      // headers: { "headerName": "headerValue", ... },
      // isBase64Encoded: true,
    };
  } catch (error) {
    return {statusCode: 500, body: error.toString()};
  }
};

module.exports = {handler};
