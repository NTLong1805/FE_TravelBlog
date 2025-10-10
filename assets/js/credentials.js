import { callApi } from "./apiHelper.js";

var apiAuthentication = "api/v1/token";

async function authentication() {
  const res = await callApi({
    url: apiAuthentication,
    method: "POST",
    data: JSON.stringify({
      email: "admin@hostname.com",
      password: "123qwe",
    }),
  });

  localStorage.setItem("token", res.token);
}

export { authentication };