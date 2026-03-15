import { User, Wallet } from "../models/index.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/emailService.js";
import { generateRandomString } from "../utils/helpers.js";
import { authConfig } from "../config/auth.js";

const generateToken = (id) => {
  return jwt.sign({ id }, authConfig.jwt.secret, { expiresIn: authConfig.jwt.expiresIn });
};

export const register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User with Email already registered" });
    }

    const emailVerificationToken = generateRandomString(32);

    const user = await User.create({
      email,
      password,
      fullName,
      emailVerificationToken,
    });

    await Wallet.create({ userId: user.id });

    // Send verification email
    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    await sendEmail({
      to: email,
      subject: "Verify your email for WaverUp Trades",
      html: `<div style="font-family: Arial, Helvetica, sans-serif; background:#f4f6f9; padding:40px 0;">
  <table width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">

        <table width="500" style="background:#ffffff; padding:30px; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
          
          <tr>
            <td style="text-align:center; padding-bottom:20px;">
              <h2 style="margin:0; color:#2c3e50;">WaverUp Trades</h2>
            </td>
          </tr>

          <tr>
            <td style="color:#555; font-size:15px; line-height:1.6;">
              <p>Hello,</p>

              <p>
                Thank you for creating an account with <strong>WaverUp Trades</strong>. 
                To complete your registration and activate your account, please verify your email address.
              </p>

              <p style="text-align:center; margin:30px 0;">
                <a href="${verifyLink}" 
                   style="background:#2563eb;
                          color:#ffffff;
                          padding:12px 25px;
                          text-decoration:none;
                          border-radius:5px;
                          font-weight:bold;
                          display:inline-block;">
                  Verify My Email
                </a>
              </p>

              <p>
                If you did not create this account, you can safely ignore this message.
              </p>

              <p style="margin-top:30px;">
                Best regards,<br/>
                <strong>WaverUp Trades Team</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="text-align:center; font-size:12px; color:#999; padding-top:20px;">
              © 2026 WaverUp Trades. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</div>`,
    });

    const token = generateToken(user.id);
    res
      .status(201)
      .json({ token, user: { id: user.id, email, fullName, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({
      where: { emailVerificationToken: token },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid token" });
    }
    user.isVerified = true;
    user.emailVerificationToken = null;
    await user.save();
    res.status(200).json({ message: "Email verified" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Forgot password, reset password similarly...

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = generateRandomString(32);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + authConfig.passwordReset.tokenExpiry;

    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 30 minutes.</p>
      `,
    });

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { password } = req.body;

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "Token expired" });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.json({ message: "Email already verified" });
    }

    const token = generateRandomString(32);

    user.emailVerificationToken = token;
    await user.save();

    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Verify your email",
      html: `<p>Click <a href="${verifyLink}">here</a> to verify your email.</p>`,
    });

    res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password incorrect" });
    }

    user.password = newPassword;

    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
