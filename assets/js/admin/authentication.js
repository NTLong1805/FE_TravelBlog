import { authentication } from "../credentials.js";

document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorDiv = document.getElementById("errorMessage");
    errorDiv.textContent = ""; // clear lỗi cũ

    console.log(password);
    try {
      // await authentication();
      const token = "1123";
      localStorage.setItem('token', token);
      window.location.href = "../admin/index.html";
    } catch (err) {
      console.error(err);
      errorDiv.textContent = "Error connecting to server";
    }
  });