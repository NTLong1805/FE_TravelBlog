function parseJwt(token) {
  return JSON.parse(atob(token.split(".")[1]));
}

function getCurrentUserId() {
    const token = localStorage.getItem("token");
    const payload = parseJwt(token);
    return payload.userId;
}

export { getCurrentUserId, parseJwt };