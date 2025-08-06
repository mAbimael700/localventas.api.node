import jwt from "jsonwebtoken";

function sign(payload, isAccessToken) {
  let expires = 0;

  if (isAccessToken) {
    expires = 3600;
  } else {
    expires = "1h";
  }

  return jwt.sign(
    payload,
    isAccessToken
      ? process.env.ACCESS_TOKEN_SECRET
      : process.env.REFRESH_TOKEN_SECRET,
    {
      algorithm: "HS256",
      expiresIn: expires,
    }
  );
}

export function generateAccessToken(user) {
  return sign({ user }, true);
}

export function generateRefreshToken(user) {
  return sign({ user }, false);
}
