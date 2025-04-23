import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract interactions
const mockContractState = {
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  verifiedInstitutions: new Map(),
  blockHeight: 100
};

// Mock contract functions
const mockContract = {
  isAdmin: () => mockContractState.admin === 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  verifyInstitution: (institution: string, name: string, website: string) => {
    if (mockContractState.admin !== 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM') {
      return { error: 403 };
    }
    if (mockContractState.verifiedInstitutions.has(institution)) {
      return { error: 100 };
    }
    mockContractState.verifiedInstitutions.set(institution, {
      name,
      website,
      verifiedAt: mockContractState.blockHeight,
      active: true
    });
    return { success: true };
  },
  revokeVerification: (institution: string) => {
    if (mockContractState.admin !== 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM') {
      return { error: 403 };
    }
    if (!mockContractState.verifiedInstitutions.has(institution)) {
      return { error: 404 };
    }
    const institutionData = mockContractState.verifiedInstitutions.get(institution);
    mockContractState.verifiedInstitutions.set(institution, {
      ...institutionData,
      active: false
    });
    return { success: true };
  },
  isVerified: (institution: string) => {
    const institutionData = mockContractState.verifiedInstitutions.get(institution);
    if (!institutionData) {
      return { error: 404 };
    }
    return { success: institutionData.active };
  },
  transferAdmin: (newAdmin: string) => {
    if (mockContractState.admin !== 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM') {
      return { error: 403 };
    }
    mockContractState.admin = newAdmin;
    return { success: true };
  }
};

describe('Institution Verification Contract', () => {
  beforeEach(() => {
    // Reset the mock state before each test
    mockContractState.admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    mockContractState.verifiedInstitutions = new Map();
    mockContractState.blockHeight = 100;
  });
  
  it('should verify an institution successfully', () => {
    const result = mockContract.verifyInstitution(
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'Harvard University',
        'harvard.edu'
    );
    expect(result).toEqual({ success: true });
    expect(mockContractState.verifiedInstitutions.has('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG')).toBe(true);
  });
  
  it('should not allow non-admin to verify an institution', () => {
    mockContractState.admin = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const result = mockContract.verifyInstitution(
        'ST3CECAKJ4BH08JYY7W53MC81BYDT4YDA5Z7XE5P1',
        'MIT',
        'mit.edu'
    );
    expect(result).toEqual({ error: 403 });
  });
  
  it('should not verify an already verified institution', () => {
    mockContract.verifyInstitution(
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'Harvard University',
        'harvard.edu'
    );
    const result = mockContract.verifyInstitution(
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'Harvard University',
        'harvard.edu'
    );
    expect(result).toEqual({ error: 100 });
  });
  
  it('should revoke verification successfully', () => {
    mockContract.verifyInstitution(
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        'Harvard University',
        'harvard.edu'
    );
    const result = mockContract.revokeVerification('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
    expect(result).toEqual({ success: true });
    
    const verificationStatus = mockContract.isVerified('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
    expect(verificationStatus).toEqual({ success: false });
  });
  
  it('should transfer admin rights successfully', () => {
    const result = mockContract.transferAdmin('ST3CECAKJ4BH08JYY7W53MC81BYDT4YDA5Z7XE5P1');
    expect(result).toEqual({ success: true });
    expect(mockContractState.admin).toBe('ST3CECAKJ4BH08JYY7W53MC81BYDT4YDA5Z7XE5P1');
  });
});
