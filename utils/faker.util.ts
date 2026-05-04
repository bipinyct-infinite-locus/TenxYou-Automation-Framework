import { faker } from '@faker-js/faker';

export const FakerUtil = {
  indianPhone(): string {
    const prefixes = ['98', '97', '96', '95', '94', '91', '90', '89', '88', '87', '86', '85', '84', '83', '82', '81', '80', '70'];
    const prefix = faker.helpers.arrayElement(prefixes);
    const remaining = faker.string.numeric(8);
    return `${prefix}${remaining}`;
  },

  indianPincode(): string {
    const validPrefixes = ['110', '400', '560', '600', '700', '500', '411', '380', '302', '452'];
    const prefix = faker.helpers.arrayElement(validPrefixes);
    return `${prefix}${faker.string.numeric(3)}`;
  },

  indianAddress() {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: FakerUtil.indianPhone(),
      addressLine1: `${faker.number.int({ min: 1, max: 999 }), faker.location.street()}`,
      addressLine2: faker.helpers.arrayElement([
        faker.location.secondaryAddress(),
        '',
        'Near ' + faker.location.street(),
      ]),
      city: faker.helpers.arrayElement([
        'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
        'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat',
      ]),
      state: faker.helpers.arrayElement([
        'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal',
        'Telangana', 'Gujarat', 'Rajasthan',
      ]),
      pincode: FakerUtil.indianPincode(),
      country: 'India',
    };
  },

  email(prefix = 'test'): string {
    return `${prefix}+${Date.now()}@automation.test`;
  },

  testTag(): string {
    return `auto_${Date.now()}`;
  },

  randomSize(): string {
    return faker.helpers.arrayElement(['6', '7', '8', '9', '10', 'S', 'M', 'L', 'XL']);
  },

  randomQuantity(min = 1, max = 3): number {
    return faker.number.int({ min, max });
  },
};
