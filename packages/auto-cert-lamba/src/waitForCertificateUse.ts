import ACM from 'aws-sdk/clients/acm';
import { backoff } from '@cfnutil/runtime';

export async function waitForCertificateUse(
  arn: string,
  acm: ACM,
  maxAttempts = 20,
): Promise<void> {
  console.log(`waiting for certificate ${arn} to become unused`);

  for (let i = 0; i < maxAttempts; ++i) {
    const cert = await acm
      .describeCertificate({ CertificateArn: arn })
      .promise();

    if (!cert.Certificate) {
      return;
    }
    if (!cert.Certificate.InUseBy || !cert.Certificate.InUseBy.length) {
      return;
    }

    await backoff(i, 1000, undefined, 60000);
  }

  throw new Error(
    `gave up waiting for certificate to be unused after ${maxAttempts} attempts`,
  );
}
