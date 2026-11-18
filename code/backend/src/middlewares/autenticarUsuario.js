const authService = require('../services/auth.service');

const autenticarUsuario = async (req, res, next) => {
  try {
    req.authUser = await authService.validarSesion(
      req.headers.cookie,
      req.correlationId
    );
    res.setHeader('Cache-Control', 'no-store');
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = autenticarUsuario;
