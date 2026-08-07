import { twMerge } from 'tailwind-merge';

export function cx(...inputs: (string | boolean | null | undefined)[]) {
  return twMerge(inputs.filter(Boolean).join(' '));
}
