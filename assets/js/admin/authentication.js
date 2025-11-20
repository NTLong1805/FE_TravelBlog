import { authentication } from "../credentials.js";

$(document).on("click", "#btnSignIn", function () {
  authentication();
  window.location.href = "../../page/admin/index.html";
});