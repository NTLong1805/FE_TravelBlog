import { callApi } from "./apiHelper.js";

const signinForm = document.querySelector(".signin__form");
const signinCard = document.querySelector(".signin__card"); // card login
const otpCard = document.getElementById("otpCard");
let contact = "";

signinForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  contact = signinForm.querySelectorAll(".signin__input")[0].value;
  const password = signinForm.querySelectorAll(".signin__input")[1].value;

  const res = await callApi({
    url: "api/v1/auth/sign-in/initiate",
    method: "POST",
    data: JSON.stringify({
      contact: contact,
      password: password,
    }),
  });

  if (res.result != null) {
    signinCard.classList.add("hidden");
    otpCard.classList.remove("hidden");
  } else {
    alert("Something went wrong!");
  }
});

const otpItems = document.querySelectorAll(".signin__otp-item");

otpItems.forEach((input, index) => {
  input.addEventListener("input", () => {
    if (input.value.length === 1 && index < otpItems.length - 1) {
      otpItems[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && index > 0 && input.value === "") {
      otpItems[index - 1].focus();
    }
  });
});

document
  .getElementById("btnVerifyOtp")
  .addEventListener("click", verfiySignIn);

async function verfiySignIn() {
  let otp = "";
  const inputs = document.querySelectorAll(".signin__otp-item");

  inputs.forEach((input) => {
    otp += input.value;
  });

  console.log(otp);

  const response = await callApi({
    url: "api/v1/auth/sign-in/verify-otp",
    method: "POST",
    data: JSON.stringify({
      contact: contact,
      verificationCode: otp,
    }),
  });

  const result = response.result;

  if (result.user != null) {
    localStorage.setItem("token", result.accessToken);
    localStorage.setItem("refreshToken", result.refreshToken);

    window.history.back();
  }
}
