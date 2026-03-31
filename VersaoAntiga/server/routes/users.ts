import { RequestHandler } from "express";
import { GetUserResponse } from "@shared/api";
import { getUserById, updateUserInStore, listUsers, updateUserPassword, deleteUser } from "../store";

export const getUser: RequestHandler = (req, res) => {
  const { id } = req.params;

  // TODO: Get user from database
  const user = getUserById(id);

  if (!user) {
    const response: GetUserResponse = {
      success: false,
      message: "User not found",
    };
    return res.status(404).json(response);
  }

  const response: GetUserResponse = {
    success: true,
    user,
  };

  res.json(response);
};

export const getCurrentUser: RequestHandler = (req, res) => {
  const user = (req as any).user;

  const response: GetUserResponse = {
    success: true,
    user,
  };

  res.json(response);
};

export const updateUser: RequestHandler = (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // TODO: Validate input and update user in database
  const updated = updateUserInStore(id, updates);
  if (!updated) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
  const password = (req.body as any).password as string | undefined;
  if (password) {
    updateUserPassword(id, password);
  }
  res.json({
    success: true,
    message: "User updated successfully",
    user: updated,
  });
};

export const updateCurrentUser: RequestHandler = (req, res) => {
  const user = (req as any).user;
  if (!user?.id) {
    return res.status(401).json({ success: false, message: "Auth required" });
  }
  const updates = req.body;
  const updated = updateUserInStore(user.id, updates);
  if (!updated) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  return res.json({ success: true, user: updated });
};

export const getUserPurchases: RequestHandler = (req, res) => {
  const { id } = req.params;

  // TODO: Get user's purchased plugins from database
  res.json({
    success: true,
    purchases: [],
    message: "No purchases found",
  });
};

export const getAllUsers: RequestHandler = (_req, res) => {
  const users = listUsers();
  res.json({ success: true, users });
};

export const deleteUserHandler: RequestHandler = (req, res) => {
  const { id } = req.params as any;
  const ok = deleteUser(id);
  if (!ok) return res.status(404).json({ success: false, message: "User not found" });
  return res.json({ success: true });
};
