const signinForm = document.querySelector(".signin__form");
const signinCard = document.querySelector(".signin__card"); // card login
const otpCard = document.getElementById("otpCard");

signinForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = signinForm.querySelectorAll(".signin__input")[0].value;
  const password = signinForm.querySelectorAll(".signin__input")[1].value;

  //   const res = await fetch("/api/auth/login", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ email, password }),
  //   });

  //   const data = await res.json();
  signinCard.classList.add("hidden");
  otpCard.classList.remove("hidden");
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
