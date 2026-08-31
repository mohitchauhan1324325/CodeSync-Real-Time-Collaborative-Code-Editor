import { SUPPORTED_LANGUAGES } from '../config/constants.js';

export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Name is required and must be a non-empty string',
    });
  }

  if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'A valid email address is required',
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters in length',
    });
  }

  next();
};

export const validateCreateRoom = (req, res, next) => {
  const { name, language } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Room name is required',
    });
  }

  if (name.trim().length > 80) {
    return res.status(400).json({
      success: false,
      message: 'Room name cannot exceed 80 characters',
    });
  }

  if (language && !SUPPORTED_LANGUAGES[language]) {
    return res.status(400).json({
      success: false,
      message: `Invalid language '${language}'. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`,
    });
  }

  next();
};

export const validateExecute = (req, res, next) => {
  const { code, language, stdin } = req.body;

  if (code === undefined || typeof code !== 'string' || code.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Source code is required for execution',
    });
  }

  if (code.length > 65536) {
    return res.status(400).json({
      success: false,
      message: 'Code payload size exceeds 64KB limit',
    });
  }

  if (stdin && typeof stdin !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Stdin must be a string',
    });
  }

  if (language && !SUPPORTED_LANGUAGES[language]) {
    return res.status(400).json({
      success: false,
      message: `Invalid language '${language}'`,
    });
  }

  next();
};
