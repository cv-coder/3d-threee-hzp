declare module '@aws-sdk/s3-request-presigner' {
  import type { S3Client } from '@aws-sdk/client-s3';

  export function getSignedUrl(
    client: S3Client,
    command: unknown,
    options?: { expiresIn?: number }
  ): Promise<string>;
}

declare module '@radix-ui/react-slot' {
  import * as React from 'react';

  export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
    children?: React.ReactNode;
  }

  export const Slot: React.ForwardRefExoticComponent<
    SlotProps & React.RefAttributes<HTMLElement>
  >;
}
