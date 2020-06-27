import { makeHandler, ResourceResponse, resourceProps } from '@cfnutil/runtime';
import { validateAutoCertProps } from './AutoCertProps';
import { createUpdateResource } from './createUpdateResource';
import { deleteResource } from './deleteResource';

export const handler = makeHandler(
  async (event): Promise<ResourceResponse> => {
    const params = resourceProps(
      validateAutoCertProps,
      event.ResourceProperties,
    );

    switch (event.RequestType) {
      case 'Create':
      case 'Update':
        return createUpdateResource(params, event);

      case 'Delete':
        return deleteResource(params, event);
    }

    return {
      Status: 'SUCCESS',
    };
  },
);
