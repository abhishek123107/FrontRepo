// Test different plan values to find what backend accepts
const testPlans = [
  // Numeric codes
  '1', '2', '3', '4', '5', '6',
  // Single letters
  'M', 'A', 'E', 'F', 'N', '24',
  // Full words
  'morning', 'afternoon', 'evening', 'full_day', 'night', '24_7',
  // With suffixes
  'morning_shift', 'afternoon_shift', 'evening_shift', 'full_access'
];

console.log('Test these plan values if needed:');
testPlans.forEach((plan, index) => {
  console.log(`${index + 1}. "${plan}"`);
});
