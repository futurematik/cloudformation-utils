import { AutoCertProps } from './AutoCertProps';
import ACM from 'aws-sdk/clients/acm';
import { CloudFormationCustomResourceDeleteEvent } from 'aws-lambda';
import { waitForCertificateUse } from './waitForCertificateUse';
import { ResourceResponse } from '@cfnutil/runtime';

export async function deleteResource(
  props: AutoCertProps,
  event: CloudFormationCustomResourceDeleteEvent,
): Promise<ResourceResponse> {
  const acm = new ACM({ region: props.Region });
  const arn = event.PhysicalResourceId;

  if (!arn.startsWith('arn:aws:acm')) {
    console.log(`physical resource "${arn}" doesn't seem to be mine`);
    return {
      Status: 'SUCCESS',
    };
  }

  try {
    await waitForCertificateUse(arn, acm);
    await acm.deleteCertificate({ CertificateArn: arn }).promise();
  } catch (e) {
    // don't throw if resource has already been removed
    if (e.code !== 'ResourceNotFoundException') {
      throw e;
    }
  }

  return {
    Status: 'SUCCESS',
  };
}
