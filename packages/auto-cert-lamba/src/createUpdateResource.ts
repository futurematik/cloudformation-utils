import { AutoCertProps } from './AutoCertProps';
import { CloudFormationCustomResourceEvent } from 'aws-lambda';
import ACM from 'aws-sdk/clients/acm';
import Route53 from 'aws-sdk/clients/route53';
import { waitForDnsChallenge } from './waitForDnsChallenge';
import { ResourceResponse, hash } from '@cfnutil/runtime';

export async function createUpdateResource(
  props: AutoCertProps,
  event: CloudFormationCustomResourceEvent,
): Promise<ResourceResponse> {
  const acm = new ACM({ region: props.Region });
  const route53 = new Route53();

  console.log(`requesting cert for ${props.DomainName}`);
  if (props.SubjectAlternativeNames && props.SubjectAlternativeNames.length) {
    console.log(`SANs = ${props.SubjectAlternativeNames.join(', ')}`);
  }

  const certRequest = await acm
    .requestCertificate({
      DomainName: props.DomainName,
      SubjectAlternativeNames: props.SubjectAlternativeNames,
      IdempotencyToken: hash([event.RequestId]).substr(0, 32),
      ValidationMethod: 'DNS',
    })
    .promise();

  if (!certRequest.CertificateArn) {
    throw new Error(`failed to request certificate`);
  }

  console.log(`requested cert with ARN ${certRequest.CertificateArn}`);

  const challenge = await waitForDnsChallenge(certRequest.CertificateArn, acm);

  const dnsChange = await route53
    .changeResourceRecordSets({
      ChangeBatch: {
        Changes: [
          {
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: challenge.Name,
              Type: challenge.Type,
              TTL: 60,
              ResourceRecords: [
                {
                  Value: challenge.Value,
                },
              ],
            },
          },
        ],
      },
      HostedZoneId: props.HostedZoneId,
    })
    .promise();

  console.log('Waiting for DNS records to commit...');
  await route53
    .waitFor('resourceRecordSetsChanged', {
      // Wait up to 10 minutes
      $waiter: {
        delay: 30,
        maxAttempts: 20,
      },
      Id: dnsChange.ChangeInfo.Id,
    })
    .promise();

  console.log('Waiting for validation...');
  await acm
    .waitFor('certificateValidated', {
      // Wait up to 10 minutes
      $waiter: {
        delay: 30,
        maxAttempts: 20,
      },
      CertificateArn: certRequest.CertificateArn,
    })
    .promise();

  return {
    Status: 'SUCCESS',
    PhysicalResourceId: certRequest.CertificateArn,
    Data: {
      CertificateArn: certRequest.CertificateArn,
    },
  };
}
