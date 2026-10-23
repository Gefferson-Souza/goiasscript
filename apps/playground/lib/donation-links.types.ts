export interface PixDonation {
  readonly kind: 'pix';
  readonly label: string;
  readonly pixKey: string;
}

export interface ExternalDonation {
  readonly kind: 'sponsors' | 'kofi';
  readonly label: string;
  readonly href: string;
}

export type DonationLink = PixDonation | ExternalDonation;
