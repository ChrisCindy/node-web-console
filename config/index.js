module.exports = {
  // Disable login if set true (don't ask for credentials, be careful)
  noLogin: false,
  // Single-user credentials
  user: 'chriscindy',
  password: '199',
  // Multi-user credentials
  // Example:
  // account: { 'user1': 'password1', 'user2':'password2' }
  accounts: {},
  // Password hash algorithm (password must be hashed)
  // Example:
  // passwordHashAlgorithm: 'md5'
  // $PASSWORD_HASH_ALGORITHM: 'sha1'
  passwordHashAlgorithm: '',
  // Home directory (multi-user mode supported)
  // Example:
  // homeDirectory: /tmp'
  // homeDirectory: {user1': '/home/user1', 'user2': '/home/user2' }
  homeDirectory: ''
}
