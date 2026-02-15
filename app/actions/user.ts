"use server";

import prisma from "@/lib/db";
import { UserRole } from "@/app/types";

export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' } 
    });
    return { success: true, users };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function createNewUser(
  username: string, 
  email: string, 
  roles: UserRole[] = [UserRole.guest] 
) {
  try {
    if (username.includes(" ")) {
      return { success: false, error: "Username cannot contain spaces" };
    }
    const newUser = await prisma.user.create({
      data: {
        username: username,
        email: email,
        passwordHash: "default_password_123",
        roles: roles, 
      },
    });
    
    console.log(`Created User: ${newUser.username} with roles: ${newUser.roles.join(", ")}`);
    return { success: true, userId: newUser.id };
    
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to create user" };
  }
}


export async function deleteUser(userId: string) {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

export async function updateUser(
  userId: string,
  username: string, 
  email: string, 
  roles: UserRole[]
) {
  try {
    if (username.includes(" ")) {
      return { success: false, error: "Username cannot contain spaces" };
    }
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: username,
        email: email,
        passwordHash: "default_password_123", 
        roles: roles, 
      },
    });
    
    console.log(`Updated User: ${updatedUser.username} with roles: ${updatedUser.roles.join(", ")}`);
    return { success: true, userId: updatedUser.id };
    
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to update user" };
  }
}