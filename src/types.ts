/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  imageUrl: string;
  priceEstimate?: string;
  features: string[];
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  description: string;
  aspect: 'portrait' | 'landscape' | 'square';
  location: string;
  year: string;
  tags?: string[];
  aiPending?: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  imageUrl: string;
}

export interface BookingData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  eventType: string;
  preferredDate: string;
  message: string;
  createdAt?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface StatItem {
  id: string;
  label: string;
  value: number;
  suffix: string;
  icon: string;
}
