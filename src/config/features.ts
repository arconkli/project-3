export const FEATURES = {
  // Set to true to enable email verification
  EMAIL_VERIFICATION: true,
  
  // Set to true to enable phone verification
  PHONE_VERIFICATION: false,
  
  // Set to true to require verification before accessing the dashboard
  REQUIRE_VERIFICATION: false,
  
  // Set to true to show verification UI elements
  SHOW_VERIFICATION_UI: true
} as const; 