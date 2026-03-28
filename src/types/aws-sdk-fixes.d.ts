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

declare module '@radix-ui/react-label' {
  import * as React from 'react';

  export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    asChild?: boolean;
  }

  export const Root: React.ForwardRefExoticComponent<
    LabelProps & React.RefAttributes<HTMLLabelElement>
  >;
}

declare module '@radix-ui/react-slider' {
  import * as React from 'react';

  export interface SliderProps extends React.HTMLAttributes<HTMLSpanElement> {
    value?: number[];
    defaultValue?: number[];
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    orientation?: 'horizontal' | 'vertical';
    dir?: 'ltr' | 'rtl';
    inverted?: boolean;
    minStepsBetweenThumbs?: number;
    onValueChange?: (value: number[]) => void;
    onValueCommit?: (value: number[]) => void;
  }

  export const Root: React.ForwardRefExoticComponent<
    SliderProps & React.RefAttributes<HTMLSpanElement>
  >;
  export const Track: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLSpanElement> & React.RefAttributes<HTMLSpanElement>
  >;
  export const Range: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLSpanElement> & React.RefAttributes<HTMLSpanElement>
  >;
  export const Thumb: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLSpanElement> & React.RefAttributes<HTMLSpanElement>
  >;
}
