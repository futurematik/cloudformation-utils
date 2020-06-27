import ACM from 'aws-sdk/clients/acm';
import { backoff } from '@cfnutil/runtime';

export async function waitForDnsChallenge(
  arn: string,
  acm: ACM,
  maxAttempts = 10,
): Promise<ACM.ResourceRecord> {
  console.log(`waiting for ACM to provide DNS challenge details`);

  for (let i = 0; i < maxAttempts; ++i) {
    const cert = await acm
      .describeCertificate({ CertificateArn: arn })
      .promise();

    if (!cert.Certificate) {
      throw new Error(`certificate ${arn} not found`);
    }

    const options = cert.Certificate.DomainValidationOptions;

    if (options && options.length && options[0].ResourceRecord) {
      return options[0].ResourceRecord;
    }

    await backoff(i, 1000, undefined, 60000);
  }

  throw new Error(
    `couldn't get DNS Challenge details after ${maxAttempts} attempts`,
  );
}
