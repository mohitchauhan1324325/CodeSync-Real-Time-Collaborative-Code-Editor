import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'codesync_super_secret_jwt_key_development_2026',
    {
      expiresIn: '7d',
    }
  );
};
