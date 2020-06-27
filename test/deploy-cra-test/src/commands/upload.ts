import { Command } from '../util/Command';
import { properties, text } from '@fmtk/validation';
import { uploadStack, makeUploadReporter } from '@cfnutil/core';

export interface UploadOptions {
  bucketName: string;
  manifestPath: string;
}

export const validateUploadOptions = properties<UploadOptions>({
  bucketName: text(),
  manifestPath: text(),
});

export const uploadCommand: Command<UploadOptions> = {
  name: 'upload',
  description: 'upload the stack and assets to S3',

  async execute(options: UploadOptions): Promise<void> {
    await uploadStack(
      options.manifestPath,
      options.bucketName,
      makeUploadReporter(),
    );
  },

  usage(): string {
    return `Options: 

    --bucketName        REQUIRED. The name of the bucket to upload to.
    --manifestPath      REQUIRED. The path to the manifest file.
`;
  },

  validate: validateUploadOptions,
};
