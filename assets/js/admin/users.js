import { callApi } from "../apiHelper.js";
import { authentication } from "../credentials.js";

var apiUserSearch = "api/v1/admin/user/search";
var userApi = "api/v1/admin/user";

let users = [];
let filteredUsers = [];
let userSearchTerm = "";
let userSearchTimer = null;
var currentPage = 1;
var pageSize = 10;

$(document).ready(async function () {
  await authentication();
  await fetchUsers();
});

$(document).on("click", ".btnAddUser", function () {
  var addUserModal = new bootstrap.Modal(
    document.getElementById("addUserModal")
  );
  addUserModal.show();
});

$(document).on("submit", "#addUserForm", function (e) {
  e.preventDefault();

  const firstName = document.getElementById("userFirstName").value;
  const lastName = document.getElementById("userLastName").value;
  const email = document.getElementById("userEmail").value;
  const password = document.getElementById("userPassword").value;

  addNewUser(firstName, lastName, email, password);

  bootstrap.Modal.getInstance(
    document.getElementById("addUserModal")
  ).hide();
  document.getElementById("addUserForm").reset();
});

$(document).on(
  "click",
  ".btnEditUser.btn.btn-sm.btn-link.text-primary",
  function () {
    const rowIndex = $(this).closest("tr").index();
    const user = filteredUsers[(currentPage - 1) * pageSize + rowIndex];
    if (user && user.id) {
      // TODO: Navigate to edit page or open edit modal
      console.log("Edit user:", user);
    }
  }
);

$(document).on("submit", "#userSearchForm", function (e) {
  e.preventDefault();
  const keyword = $("#userSearchInput").val();
  applyUserSearch(keyword);
});

$(document).on("click", "#userSearchReset", function () {
  if ($(this).prop("disabled")) {
    return;
  }
  $("#userSearchInput").val("");
  applyUserSearch("");
});

$(document).on("input", "#userSearchInput", function () {
  const keyword = $(this).val();
  clearTimeout(userSearchTimer);
  userSearchTimer = setTimeout(() => {
    applyUserSearch(keyword);
  }, 300);
});

async function fetchUsers() {
  const token = localStorage.getItem("token");

  try {
    const res = await callApi({
      url: apiUserSearch,
      method: "POST",
      data: JSON.stringify({
        pageNumber: 0,
        pageSize: pageSize,
        orderBy: ["id"],
        ignorePagination: true,
      }),
      token: token,
      contentType: "application/json; charset=utf-8",
    });

    const result = res.result;
    users = Array.isArray(result.data) ? result.data : [];
    applyUserSearch(userSearchTerm, { skipInputSync: true });
  } catch (err) {
    console.error("Failed to fetch users:", err);
    users = [];
    filteredUsers = [];
    currentPage = 1;
    updateTable();
  }
}

async function addNewUser(firstName, lastName, email, password) {
  const token = localStorage.getItem("token");
  
  try {
    await callApi({
      url: userApi,
      method: "POST",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
      }),
      token: token,
    });

    await fetchUsers();
  } catch (err) {
    console.error("Failed to add user:", err);
  }
}

function renderTable(page) {
  const $tbody = $(".user-table-body");
  $tbody.empty();

  if (!filteredUsers.length) {
    $tbody.html(
      '<tr><td colspan="6" class="text-center py-3">Không có dữ liệu</td></tr>'
    );
    return;
  }

  const start = (page - 1) * pageSize;
  const pageData = filteredUsers.slice(start, start + pageSize);
  let rows = "";
  pageData.forEach((user, idx) => {
    rows += `<tr>
                    <td>${start + idx + 1}</td>
                    <td>${escapeHtml(user.firstName || "")}</td>
                    <td>${escapeHtml(user.lastName || "")}</td>
                    <td>${escapeHtml(user.email || "")}</td>
                    <td>${user.numberOfPosts || 0}</td>
                    <td>
                        <button class="btnEditUser btn btn-sm btn-link text-primary" title="Edit"><i class="ti ti-edit"></i></button>
                        <button class="btn btn-sm btn-link text-danger" title="Archive"><i class="ti ti-archive"></i></button>
                    </td>
                </tr>`;
  });

  $tbody.html(rows);
}

function renderPagination() {
  const $ul = $("#user-table tfoot .pagination");
  $ul.empty();

  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  if (!filteredUsers.length || totalPages === 0) {
    $ul.closest("nav").hide();
    return;
  } else {
    $ul.closest("nav").show();
  }

  // Prev button
  $ul.append(`<li class="page-item ${currentPage === 1 ? "disabled" : ""}">
                    <a class="page-link" href="#" data-page="prev">Prev</a>
                </li>`);

  // Number
  for (let i = 1; i <= totalPages; i++) {
    $ul.append(`<li class="page-item ${i === currentPage ? "active" : ""}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>`);
  }

  // Next button
  $ul.append(`<li class="page-item ${
    currentPage === totalPages ? "disabled" : ""
  }">
                    <a class="page-link" href="#" data-page="next">Next</a>
                </li>`);

  $ul.off("click", "a.page-link");
  $ul.on("click", "a.page-link", function (e) {
    e.preventDefault();
    const action = $(this).data("page");

    if (action === "prev") {
      if (currentPage > 1) currentPage--;
    } else if (action === "next") {
      if (currentPage < totalPages) currentPage++;
    } else {
      const pageNum = parseInt(action, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        currentPage = pageNum;
      }
    }

    updateTable();
    $("#user-table").scrollTop(0);
  });
}

function updateTable() {
  renderTable(currentPage);
  renderPagination();
}

function applyUserSearch(keyword, options = {}) {
  const { skipInputSync = false } = options;
  userSearchTerm = (keyword || "").toString();
  const normalized = userSearchTerm.trim().toLowerCase();

  if (!normalized) {
    filteredUsers = [...users];
  } else {
    filteredUsers = users.filter((user) => {
      const firstName = (user.firstName || "").toString().toLowerCase();
      const lastName = (user.lastName || "").toString().toLowerCase();
      const email = (user.email || "").toString().toLowerCase();

      return (
        firstName.includes(normalized) ||
        lastName.includes(normalized) ||
        email.includes(normalized)
      );
    });
  }

  if (!skipInputSync) {
    $("#userSearchInput").val(userSearchTerm);
  }

  toggleUserSearchResetState();
  currentPage = 1;
  updateTable();
}

function toggleUserSearchResetState() {
  const hasKeyword = userSearchTerm.trim().length > 0;
  $("#userSearchReset").prop("disabled", !hasKeyword);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

