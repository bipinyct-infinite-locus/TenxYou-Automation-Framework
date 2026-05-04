export const TEST_USERS = {
  primary: {
    phone: process.env.AUTH_PHONE || '9999999999',
    email: 'test@automation.test',
  },
};

export const TEST_ADDRESSES = {
  valid: {
    firstName: 'Test',
    lastName: 'User',
    phone: '9876543210',
    addressLine1: '123, MG Road',
    addressLine2: 'Near Central Mall',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
  },
  invalidPincode: {
    firstName: 'Test',
    lastName: 'User',
    phone: '9876543210',
    addressLine1: '123, Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '000000',
  },
  missingRequired: {
    firstName: '',
    lastName: 'User',
    phone: '9876543210',
    addressLine1: '',
    city: '',
    state: 'Maharashtra',
    pincode: '400001',
  },
};
