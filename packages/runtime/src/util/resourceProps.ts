import {
  ValueValidator,
  ValidationMode,
  ExtraFieldsMode,
  ModelValidationError,
  ValidationError,
} from '@fmtk/validation';

export function resourceProps<T>(
  validator: ValueValidator<T>,
  value: unknown,
): T {
  const result = validator({
    value,
    mode: ValidationMode.String,
    extraFields: ExtraFieldsMode.Ignore,
  });
  if (!result.ok) {
    const err = new ModelValidationError(result.errors);
    const details = getErrorMessage(result.errors);
    err.message = `Property validation failed [${details}]`;
    throw err;
  }
  return result.value;
}

function getErrorMessage(errors: ValidationError[]) {
  return errors.map((x) => `${x.field}: ${x.text}`).join(', ');
}
