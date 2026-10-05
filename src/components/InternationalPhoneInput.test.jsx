import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import InternationalPhoneInput from './InternationalPhoneInput';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

describe('InternationalPhoneInput', () => {
  it('renders default country India (+91) with pattern placeholder XXXXX XXXXX', () => {
    render(<InternationalPhoneInput defaultCountry="IN" />);
    expect(screen.getByRole('button', { name: /Selected country/i })).toHaveTextContent('India');
    const input = screen.getByRole('textbox', { name: /Mobile Number/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'XXXXX XXXXX');
  });

  it('validates Indian phone numbers correctly', () => {
    let changeData = null;
    render(
      <InternationalPhoneInput 
        defaultCountry="IN" 
        onChange={(data) => { changeData = data; }}
      />
    );

    const input = screen.getByRole('textbox', { name: /Mobile Number/i });
    fireEvent.change(input, { target: { value: '9876543210' } });

    expect(changeData).not.toBeNull();
    expect(changeData.isValid).toBe(true);
    expect(changeData.e164).toBe('+919876543210');
    expect(changeData.country).toBe('IN');
  });

  it('validates US phone numbers correctly with (XXX) XXX-XXXX pattern placeholder', () => {
    let changeData = null;
    render(
      <InternationalPhoneInput 
        defaultCountry="US" 
        onChange={(data) => { changeData = data; }}
      />
    );

    const input = screen.getByRole('textbox', { name: /Mobile Number/i });
    expect(input).toHaveAttribute('placeholder', '(XXX) XXX-XXXX');
    fireEvent.change(input, { target: { value: '2025550143' } });

    expect(changeData).not.toBeNull();
    expect(changeData.isValid).toBe(true);
    expect(changeData.e164).toBe('+12025550143');
    expect(changeData.country).toBe('US');
  });

  it('shows dynamic validation error for invalid length', () => {
    let changeData = null;
    render(
      <InternationalPhoneInput 
        defaultCountry="IN" 
        onChange={(data) => { changeData = data; }}
      />
    );

    const input = screen.getByRole('textbox', { name: /Mobile Number/i });
    fireEvent.change(input, { target: { value: '123' } });
    fireEvent.blur(input);

    expect(changeData.isValid).toBe(false);
    expect(changeData.error).toContain('India');
    expect(screen.getByText(/Phone number is too short/i)).toBeInTheDocument();
  });

  it('opens searchable dropdown and filters by country name or code', () => {
    render(<InternationalPhoneInput defaultCountry="IN" />);

    const selectBtn = screen.getByRole('button', { name: /Selected country/i });
    fireEvent.click(selectBtn);

    const searchInput = screen.getByRole('textbox', { name: /Search countries/i });
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'United Kingdom' } });
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
    expect(screen.getByText('+44')).toBeInTheDocument();
  });

  it('auto-detects country when user pastes international format number starting with +', () => {
    let changeData = null;
    render(
      <InternationalPhoneInput 
        defaultCountry="IN" 
        onChange={(data) => { changeData = data; }}
      />
    );

    const input = screen.getByRole('textbox', { name: /Mobile Number/i });
    fireEvent.change(input, { target: { value: '+44 7911 123456' } });

    expect(changeData).not.toBeNull();
    expect(['GB', 'GG', 'JE', 'IM']).toContain(changeData.country);
    expect(changeData.isValid).toBe(true);
    expect(changeData.e164).toBe('+447911123456');
    expect(screen.getByRole('button', { name: /Selected country/i })).toHaveTextContent(/United Kingdom|Guernsey|Jersey|Isle of Man/);
  });
});
