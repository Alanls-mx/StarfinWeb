import { RequestHandler } from "express";
import { AuthResponse, LoginRequest, RegisterRequest } from "@shared/api";
import { registerUser, authenticate, resetPasswordByEmail, findUserByEmail } from "../store";
import jwt from "jsonwebtoken";

const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN: jwt.SignOptions["expiresIn"] = (process.env.JWT_EXPIRES_IN as unknown as jwt.SignOptions["expiresIn"]) || "7d";

export const handleLogin: RequestHandler = (req, res) => {
  const { email, password } = req.body as LoginRequest;

  if (!email || !password) {
    const response: AuthResponse = {
      success: false,
      message: "Email and password are required",
    };
    return res.status(400).json(response);
  }
  const user = authenticate(email, password);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Credenciais inválidas",
    });
  }
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  const response: AuthResponse = {
    success: true,
    message: "Login successful",
    user,
    token,
  };
  res.json(response);
};

export const handleRegister: RequestHandler = (req, res) => {
  const { email, password, username } = req.body as RegisterRequest;

  if (!email || !password || !username) {
    const response: AuthResponse = {
      success: false,
      message: "All fields are required",
    };
    return res.status(400).json(response);
  }
  const result = registerUser(email, password, username);
  if ("error" in result) {
    return res.status(409).json({ success: false, message: result.error });
  }
  const token = jwt.sign(
    { sub: result.user.id, email: result.user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
  const response: AuthResponse = {
    success: true,
    message: "Registration successful",
    user: result.user,
    token,
  };
  res.json(response);
};

export const handleLogout: RequestHandler = (_req, res) => {
  const response: AuthResponse = {
    success: true,
    message: "Logout successful",
  };
  res.json(response);
};

export const handleForgotPassword: RequestHandler = (req, res) => {
  const email = (req.body?.email as string | undefined) || "";
  if (!email) return res.status(400).json({ success: false, message: "Email é obrigatório" });
  const user = findUserByEmail(email);
  // Sem envio de email neste demo; apenas responde genericamente
  if (!user) return res.json({ success: true, message: "Se o email existir, enviaremos instruções" });
  return res.json({ success: true, message: "Se o email existir, enviaremos instruções" });
};

export const handleResetPassword: RequestHandler = (req, res) => {
  const email = req.body?.email as string | undefined;
  const newPassword = req.body?.newPassword as string | undefined;
  if (!email || !newPassword) return res.status(400).json({ success: false, message: "Email e nova senha são obrigatórios" });
  const ok = resetPasswordByEmail(email, newPassword);
  if (!ok) return res.status(404).json({ success: false, message: "Usuário não encontrado" });
  return res.json({ success: true, message: "Senha redefinida!" });
};
