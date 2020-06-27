export interface Parameter {
  AllowedPattern?: string;
  AllowedValues?: any[];
  ConstraintDescription?: string;
  Default?: any;
  Description?: string;
  MaxLength?: number;
  MaxValue?: number;
  MinLength?: number;
  MinValue?: number;
  NoEcho?: boolean;
  Type: string;
}
