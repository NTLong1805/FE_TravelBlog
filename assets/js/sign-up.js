import { callApi } from "./apiHelper.js";

const signupForm = document.querySelector(".signin__form");
const signUp = document.querySelector(".signin__card");
const otpCard = document.getElementById("otpCard");
const initiateSignupApi = "api/v1/sign-up/initiate";
const verifySignupApi = "api/v1/sign-up/verify-contact";
const resendOtpApi = "api/v1/sign-up/resend-otp";
var jq = jQuery.noConflict();

let verificationId = "";
let contact = "";

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  await initiateSignUp();
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

async function initiateSignUp() {
  const firstName = signupForm.querySelectorAll(".signin__input")[0].value;
  const lastName = signupForm.querySelectorAll(".signin__input")[1].value;
  const email = signupForm.querySelectorAll(".signin__input")[2].value;
  const password = signupForm.querySelectorAll(".signin__input")[3].value;
  const confirmPassword =
    signupForm.querySelectorAll(".signin__input")[4].value;

  const response = await callApi({
    url: initiateSignupApi,
    method: "POST",
    data: JSON.stringify({
      firstName: firstName,
      lastName: lastName,
      contact: email,
      password: password,
      confirmPassword: confirmPassword,
    }),
  });

  const result = response.result;

  if (result.IsContactExists) {
    alert("Email's use is exist! Please send another email");
    return;
  }

  if (result.verificationId == null) {
    alert("Failed to send code! Please try again!");
    return;
  }

  verificationId = result.verificationId;
  contact = result.contact;
  await verifySignUp();
}

async function verifySignUp() {
  signUp.classList.add("hidden");
  otpCard.classList.remove("hidden");

  document
    .getElementById("btnVerifyOtp")
    .addEventListener("click", function () {
      const inputs = document.querySelectorAll(".signin__otp-item");
      let otp = "";

      inputs.forEach((input) => {
        otp += input.value;
      });

      console.log(otp);
    });

  const response = await callApi({
    url: verifySignupApi,
    method: "POST",
    data: JSON.stringify({
      firstName: firstName,
      lastName: lastName,
      contact: email,
      password: password,
      confirmPassword: confirmPassword,
    }),
  });

  const result = response.result;

  if (result.userId != null) {
    localStorage.setItem("token", result.accessToken);
    localStorage.setItem("refreshToken", result.refreshToken);

    window.location.href = "../index.html";
  }
}

document
  .getElementsByClassName("signin__otp-resend")
  .addEventListener("click", async function resendOtp() {
    const response = await callApi({
      url: resendOtpApi,
      method: "POST",
      data: JSON.stringify({
        verificationId: verificationId,
        contact: contact,
      }),
    });

    const result = response.result;

    if (result.isSent) {
      verificationId = result.verificationId;
      alert("OTP is sent again! Please check your email!");
    }
  });
