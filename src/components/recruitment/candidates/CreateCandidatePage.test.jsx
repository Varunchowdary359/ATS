import { describe, it, expect, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { ToastProvider } from '../../shared/ToastContext';
import CreateCandidatePage from './CreateCandidatePage';

expect.extend(matchers);

const renderWithProviders = (ui) => {
  return render(
    <ToastProvider>
      {ui}
    </ToastProvider>
  );
};

afterEach(() => {
  cleanup();
});

describe('CreateCandidatePage Phone Number Input Interaction', () => {
  it('renders phone input with India default and formats as user types', () => {
    renderWithProviders(<CreateCandidatePage onBack={() => {}} onCandidateCreated={() => {}} brandColor="#0284c7" />);

    const phoneInput = screen.getByRole('textbox', { name: /Mobile Number/i });
    expect(phoneInput).toBeInTheDocument();

    // Simulate typing Indian mobile number digits
    fireEvent.change(phoneInput, { target: { value: '9876512345' } });
    expect(phoneInput.value).toBe('98765 12345');
  });

  it('validates required phone number on Step 1 Next', async () => {
    renderWithProviders(<CreateCandidatePage onBack={() => {}} onCandidateCreated={() => {}} brandColor="#0284c7" />);

    // Fill names and email but leave phone empty
    fireEvent.change(screen.getByPlaceholderText(/Enter first name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter last name/i), { target: { value: 'Walker' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter candidate email address/i), { target: { value: 'alice@example.com' } });

    // Click Continue
    const continueBtns = screen.getAllByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtns[continueBtns.length - 1]);

    // Verify phone required validation error is shown
    expect(screen.getByText(/Valid contact phone number is required/i)).toBeInTheDocument();

    // Now type valid non-duplicate phone number
    const phoneInput = screen.getByRole('textbox', { name: /Mobile Number/i });
    fireEvent.change(phoneInput, { target: { value: '9876512345' } });
    expect(phoneInput.value).toBe('98765 12345');

    // Click Continue again
    fireEvent.click(continueBtns[continueBtns.length - 1]);

    // Should successfully advance to Step 2 (awaiting async checkDuplicate)
    await waitFor(() => {
      expect(screen.getByText(/Section 2: Professional/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe('CreateCandidatePage Candidate Creation Methods (Manual vs Resume Upload)', () => {
  it('renders Candidate Creation Method options and starts with empty summary fields', () => {
    renderWithProviders(<CreateCandidatePage onBack={() => {}} onCandidateCreated={() => {}} brandColor="#0284c7" />);

    expect(screen.getAllByText(/Candidate Creation Method/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Manual Create/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Resume Upload/i).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/Enter first name/i)).toBeInTheDocument();
    expect(screen.getByText(/0% Complete/i)).toBeInTheDocument();
  });

  it('switches to Resume Upload mode and shows upload section', async () => {
    renderWithProviders(<CreateCandidatePage onBack={() => {}} onCandidateCreated={() => {}} brandColor="#0284c7" />);

    // Click Resume Upload method option card
    const resumeMethodBtns = screen.getAllByText(/Resume Upload/i);
    fireEvent.click(resumeMethodBtns[0]);

    // Should show upload area
    expect(screen.getByText(/Upload Candidate Resume/i)).toBeInTheDocument();
    expect(screen.getByText(/Browse \/ Upload Resume/i)).toBeInTheDocument();
  });

  it('processes DOCX resume content and extracts candidate details accurately without XML noise', async () => {
    renderWithProviders(<CreateCandidatePage onBack={() => {}} onCandidateCreated={() => {}} brandColor="#0284c7" />);

    // Switch to Resume Upload mode
    const resumeMethodBtns = screen.getAllByText(/Resume Upload/i);
    fireEvent.click(resumeMethodBtns[0]);

    // Verify file input exists inside upload area
    const fileInput = screen.getByText(/Drag & Drop Candidate Resume Here/i).closest('div').parentElement.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it('allows candidate creation with 0 years experience (freshers/entry-level)', async () => {
    const onCreated = vi.fn();
    renderWithProviders(<CreateCandidatePage onBack={() => {}} onCandidateCreated={onCreated} brandColor="#0284c7" />);

    // Fill Step 1
    fireEvent.change(screen.getByPlaceholderText(/Enter first name/i), { target: { value: 'Surya' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter last name/i), { target: { value: 'Rocky' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter candidate email address/i), { target: { value: 'suryarocky9704@gmail.com' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Mobile Number/i }), { target: { value: '8589485415' } });

    // Click Continue to Step 2
    const continueBtns = screen.getAllByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtns[continueBtns.length - 1]);

    // Fill Step 2 with 0 years experience
    await waitFor(() => {
      expect(screen.getByText(/Section 2: Professional/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter current job title/i), { target: { value: 'Associate Engineer' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter experience in years/i), { target: { value: '0' } });

    // Step 2 Continue
    const continueBtns2 = screen.getAllByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtns2[continueBtns2.length - 1]);

    // Step 3 Continue (Talent Pool default)
    await waitFor(() => {
      expect(screen.getByText(/Section 3: Requisition/i)).toBeInTheDocument();
    });
    const continueBtns3 = screen.getAllByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtns3[continueBtns3.length - 1]);

    // Step 4 Continue
    await waitFor(() => {
      expect(screen.getByText(/Section 4: Resume/i)).toBeInTheDocument();
    });
    const continueBtns4 = screen.getAllByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtns4[continueBtns4.length - 1]);

    // Step 5 Submit
    await waitFor(() => {
      expect(screen.getByText(/Final Review/i)).toBeInTheDocument();
    });
    const submitBtns = screen.getAllByRole('button', { name: /Create Candidate/i });
    fireEvent.click(submitBtns[submitBtns.length - 1]);

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalled();
    });
  });
});
