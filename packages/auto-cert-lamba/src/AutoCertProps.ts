import { properties, text, optional, array } from '@fmtk/validation';

export interface AutoCertProps {
  DomainName: string;
  HostedZoneId: string;
  Region?: string;
  SubjectAlternativeNames?: string[];
}

export const validateAutoCertProps = properties<AutoCertProps>({
  DomainName: text(),
  HostedZoneId: text(),
  Region: optional(text()),
  SubjectAlternativeNames: optional(array(text())),
});
