import { AppError } from "./errorHandler.js";

export function validateRequired(body, fields) {
  const missing = [];
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      missing.push(field);
    }
  }
  if (missing.length > 0) {
    throw new AppError(`Thiếu thông tin bắt buộc: ${missing.join(", ")}`, 400);
  }
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !re.test(email)) {
    throw new AppError("Định dạng email không hợp lệ", 400);
  }
}

export function validatePassword(password, minLength = 6) {
  if (!password || password.length < minLength) {
    throw new AppError(`Mật khẩu phải có ít nhất ${minLength} ký tự`, 400);
  }
}

export function validateInt(val, name = "ID") {
  const num = parseInt(val, 10);
  if (isNaN(num) || num <= 0) {
    throw new AppError(`${name} không hợp lệ`, 400);
  }
  return num;
}
