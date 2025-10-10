import { callApi } from "../apiHelper.js";
import { authentication } from "../credentials.js";

var apiSearch = BASE_URL + "api/v1/admin/categories/search";
var categoryApi = BASE_URL + "api/v1/admin/categories";

let allData = [];
var currentPage = 1;
var pageSize = 10;

$(document).ready(async function () {
  await authentication();
  await fetchCategories();
});

$(document).on("click", ".btnAddCategory", function () {
  var addCategoryModal = new bootstrap.Modal(
    document.getElementById("addCategoryModal")
  );
  addCategoryModal.show();
});

$(document).on("submit", "#addCategoryForm", function (e) {
  e.preventDefault();

  const name = document.getElementById("categoryName").value;

  addNewCategory(name);

  bootstrap.Modal.getInstance(
    document.getElementById("addCategoryModal")
  ).hide();
  document.getElementById("addCategoryForm").reset();
});

$(document).on(
  "click",
  ".btnEditCategory.btn.btn-sm.btn-link.text-primary",
  function () {
    const rowIndex = $(this).closest("tr").index();
    const category = allData[(currentPage - 1) * pageSize + rowIndex];
    if (category && category.id) {
      window.location.href = `page/admin/category-detail.html`;
    }
  }
);

async function fetchCategories() {
  const token = localStorage.getItem("token");
  try {
    const response = await callApi({
      url: apiSearch,
      type: "POST",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify({
        pageNumber: 0,
        pageSize: pageSize,
        orderBy: ["id"],
        ignorePagination: true,
      }),
      token: token,
    });

    var result = response.result;
    allData = Array.isArray(result.data) ? result.data : [];
    currentPage = 1;
    updateTable();
  } catch (err) {
    console.error("Failed to fetch categories:", err);
    allData = [];
    updateTable();
  }
}

function renderTable(page) {
  const $tbody = $("#category-table tbody");
  $tbody.empty();

  if (allData.length === 0) {
    $tbody.html(
      '<tr><td colspan="3" class="text-center py-3">Không có dữ liệu</td></tr>'
    );
    return;
  }

  const start = (page - 1) * pageSize;
  const pageData = allData.slice(start, start + pageSize);

  let rows = "";
  pageData.forEach((category, idx) => {
    rows += `<tr>
      <td>${start + idx + 1}</td>
      <td>${escapeHtml(category.name || "")}</td>
      <td>
        <button class="btnEditCategory btn btn-sm btn-link text-primary" title="Edit"><i class="ti ti-edit"></i></button>
        <button class="btn btn-sm btn-link text-danger" title="Archive"><i class="ti ti-archive"></i></button>
      </td>
    </tr>`;
  });

  $tbody.html(rows);
}

function renderPagination() {
  const $ul = $("#category-table tfoot .pagination");
  $ul.empty();

  const totalPages = Math.ceil(allData.length / pageSize);

  if (allData.length === 0 || totalPages === 0) {
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
    $("#category-table").scrollTop(0);
  });
}

function updateTable() {
  renderTable(currentPage);
  renderPagination();
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function addNewCategory(name) {
  var token = localStorage.getItem("token");
  var response = await callApi({
    url: categoryApi,
    type: "POST",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({
      name: name,
    }),
    token: token,
  });

  fetchCategories();
}
