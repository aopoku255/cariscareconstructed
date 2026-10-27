import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LmiChart } from '@/components/charts/LmiChart';
import { NewsletterForm } from '@/components/forms/NewsletterForm';
import { MainNav } from '@/components/layout/MainNav';
import { CmsImage } from '@/components/ui/CmsImage';
import { Pagination } from '@/components/ui/Pagination';
import type { MenuNode } from '@/types/api';

vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

const node = (id: number, label: string, href: string, children: MenuNode[] = [], extra: Partial<MenuNode> = {}): MenuNode => ({
  id,
  label,
  href,
  description: null,
  open_in_new_tab: false,
  external: /^https?:/.test(href),
  children,
  ...extra,
});

const MENU = [
  node(1, 'Home', '/'),
  node(2, 'Research', '/research', [node(3, 'Publications & Resources', '/publications'), node(4, 'Logistics Managers Index (LMI)', '/lmi')]),
  node(5, '2026 Summit', 'https://summit2026.carisca.org/', [], { open_in_new_tab: true }),
];

describe('CmsImage', () => {
  it('shows a labelled placeholder with the intended dimensions when no image is set', () => {
    render(<CmsImage media={null} slot="portrait" />);
    const img = screen.getByAltText('Image placeholder: Staff portrait (600 × 750 px)');
    expect(img).toHaveAttribute('src', '/images/placeholders/staff-portrait-placeholder.svg');
    expect(img.closest('[data-placeholder]')).toHaveStyle({ aspectRatio: '600 / 750' });
  });

  it('renders the uploaded image with its alt text', () => {
    render(
      <CmsImage
        slot="newsThumb"
        media={{ id: 1, url: 'http://localhost:5000/uploads/2026/01/a.jpg', kind: 'image', mime_type: 'image/jpeg', size_bytes: 1, width: 800, height: 500, alt_text: 'Summit participants', caption: null, title: null, original_name: 'a.jpg' }}
      />,
    );
    expect(screen.getByAltText('Summit participants')).toBeInTheDocument();
  });
});

describe('MainNav', () => {
  it('opens and closes dropdowns with the keyboard', async () => {
    const user = userEvent.setup();
    render(<MainNav items={MENU} utility={[]} contact={{}} />);
    const button = screen.getAllByRole('button', { name: /Research/ })[0];
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('link', { name: 'Publications & Resources' })[0]).toBeVisible();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });

  it('marks external links as opening in a new tab', () => {
    render(<MainNav items={MENU} utility={[]} contact={{}} />);
    const link = screen.getAllByRole('link', { name: /2026 Summit/ })[0];
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveTextContent('(opens in a new tab)');
  });

  it('opens the mobile drawer as a modal dialog', async () => {
    const user = userEvent.setup();
    render(<MainNav items={MENU} utility={[]} contact={{ phone: '024-469-2953' }} />);
    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const dialog = screen.getByRole('dialog', { name: 'Site menu' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveFocus();
    expect(dialog).not.toHaveAttribute('inert');
    await user.click(screen.getByRole('button', { name: 'Close menu' }));
    // The drawer stays mounted so it can slide out; once closed it is inert and focus returns to Menu.
    expect(dialog).toHaveAttribute('inert');
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus();
  });
});

describe('NewsletterForm', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows server-side validation errors next to the field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { code: 'validation_error', message: 'Some fields are invalid.', fields: [{ path: 'email', message: 'Enter a valid email address' }] } }), { status: 422 }),
      ),
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<NewsletterForm />);
    await user.type(screen.getByLabelText('Email address'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true');
  });

  it('confirms a successful subscription and sends the consent flag', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { ok: true, status: 'subscribed', message: 'Thank you. You are subscribed to the CARISCA newsletter.' } }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<NewsletterForm />);
    await user.type(screen.getByLabelText('Email address'), 'reader@example.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(await screen.findByText(/You are subscribed/)).toBeInTheDocument();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ email: 'reader@example.com', consent: true, website: '' });
    expect(typeof body.startedAt).toBe('number');
  });
});

describe('Pagination', () => {
  it('keeps filters in page links and marks the current page', () => {
    render(<Pagination meta={{ page: 2, pageSize: 12, total: 50, totalPages: 5 }} basePath="/news" params={{ type: 'call', q: undefined }} />);
    expect(screen.getByRole('link', { name: /Next/ })).toHaveAttribute('href', '/news?type=call&page=3');
    expect(screen.getByRole('link', { name: /Previous/ })).toHaveAttribute('href', '/news?type=call');
    expect(screen.getByText('2')).toHaveAttribute('aria-current', 'page');
  });

  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination meta={{ page: 1, pageSize: 12, total: 3, totalPages: 1 }} basePath="/news" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('LmiChart', () => {
  it('plots only stored values and breaks the line where data is missing', () => {
    const { container } = render(
      <LmiChart
        points={[
          { label: 'Q1 2022', key: 2022.1, value: 64.7 },
          { label: 'Q2 2022', key: 2022.2, value: 65.9 },
          { label: 'Q3 2022', key: 2022.3, value: null },
          { label: 'Q1 2023', key: 2023.1, value: 67 },
          { label: 'Q2 2023', key: 2023.2, value: 64.2 },
        ]}
      />,
    );
    expect(container.querySelectorAll('path')).toHaveLength(2);
    expect(screen.getByRole('img', { name: 'Q1 2023: 67.0' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Q3 2022/ })).not.toBeInTheDocument();
  });
});
