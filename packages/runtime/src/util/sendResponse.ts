import https from 'https';
import { IncomingMessage } from 'http';
import { CloudFormationCustomResourceResponse } from 'aws-lambda';

export async function sendResponse(
  url: string,
  response: CloudFormationCustomResourceResponse,
): Promise<IncomingMessage> {
  return await new Promise<IncomingMessage>((resolve, reject) => {
    var body = Buffer.from(JSON.stringify(response));

    const req = https.request(
      url,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': body.length,
        },
      },
      resolve,
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
