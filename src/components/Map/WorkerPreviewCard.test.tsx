import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import WorkerPreviewCard, { formatRating } from './WorkerPreviewCard';

function renderCard(props: Parameters<typeof WorkerPreviewCard>[0]) {
  return render(
    <MemoryRouter>
      <WorkerPreviewCard {...props} />
    </MemoryRouter>
  );
}

describe('WorkerPreviewCard', () => {
  const baseProps = {
    id: 'worker-123',
    name: 'Juan Dela Cruz',
    primarySkill: 'plumber' as const,
    averageRating: 4.5,
    isVerified: true,
    contactNumber: '09171234567',
  };

  it('displays the worker name', () => {
    renderCard(baseProps);
    expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
  });

  it('displays the primary skill', () => {
    renderCard(baseProps);
    expect(screen.getByText('plumber')).toBeInTheDocument();
  });

  it('displays the average rating formatted to one decimal place', () => {
    renderCard(baseProps);
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
  });

  it('displays "No ratings yet" when averageRating is null', () => {
    renderCard({ ...baseProps, averageRating: null });
    expect(screen.getByText('No ratings yet')).toBeInTheDocument();
  });

  it('displays a verification badge when isVerified is true', () => {
    renderCard(baseProps);
    expect(screen.getByText(/Verified/)).toBeInTheDocument();
  });

  it('does not display a verification badge when isVerified is false', () => {
    renderCard({ ...baseProps, isVerified: false });
    expect(screen.queryByText(/Verified/)).not.toBeInTheDocument();
  });

  it('renders a contact button with tel: link when contactNumber is provided', () => {
    renderCard(baseProps);
    const contactBtn = screen.getByTestId('contact-button');
    expect(contactBtn).toBeInTheDocument();
    expect(contactBtn).toHaveAttribute('href', 'tel:09171234567');
  });

  it('renders request service button when no contactNumber', () => {
    renderCard({ ...baseProps, contactNumber: undefined });
    const requestBtn = screen.getByTestId('request-service-button');
    expect(requestBtn).toBeInTheDocument();
  });

  it('links to the full worker profile page', () => {
    renderCard(baseProps);
    const profileLink = screen.getByLabelText('View full profile of Juan Dela Cruz');
    expect(profileLink).toHaveAttribute('href', '/worker/worker-123');
  });

  it('has a minimum 44x44px tap target on the contact button', () => {
    renderCard(baseProps);
    const contactBtn = screen.getByTestId('contact-button');
    expect(contactBtn.className).toContain('min-h-[44px]');
    expect(contactBtn.className).toContain('min-w-[44px]');
  });
});

describe('formatRating', () => {
  it('returns "No ratings yet" for null', () => {
    expect(formatRating(null)).toBe('No ratings yet');
  });

  it('formats a rating to one decimal place', () => {
    expect(formatRating(4.5)).toBe('4.5');
    expect(formatRating(3.0)).toBe('3.0');
    expect(formatRating(4.123)).toBe('4.1');
  });
});
