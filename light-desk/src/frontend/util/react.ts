export const calculateClass = (
  ...args: (string | undefined | null | false)[]
): string => args.filter((a) => !!a).join(' ');
