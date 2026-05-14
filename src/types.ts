/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Lead {
  id: string;
  name: string;
  role: string;
  company: string;
  website: string;
  email: string;
  status: 'pending' | 'generating' | 'drafted' | 'sent';
  draftSubject?: string;
  draftBody?: string;
  companySummary?: string;
}

export type LeadCSVRow = {
  'First Name': string;
  'Last Name': string;
  Title: string;
  Company: string;
  Email: string;
  Country?: string;
};
