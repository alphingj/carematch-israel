const ADMIN_EMAILS = [
  'alphingj@gmail.com',
  'alphingrowthchannel@gmail.com',
];

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email);
}
