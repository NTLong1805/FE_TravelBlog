import { callApi } from "../apiHelper.js";

var apiBlogSearch = "api/v1/admin/blogs/search";
var apiUserSearch = "api/v1/admin/user/search";

let blogs = [];
let users = [];
let userMap = {};
var currentPage = 1;
var pageSize = 10;

const BlogStatus = {
  0: "Draft",
  1: "In Review",
  2: "Approved",
  3: "Rejected"
};

const StatusClass = {
  0: "border-secondary text-secondary", 
  1: "border-warning text-warning",     
  2: "border-success text-success",     
  3: "border-danger text-danger"        
};

$(document).ready(async function () {
  await fetchUsers();
  await fetchBlogs();
});

$(document).on("click", ".btnPostBlog.btn.btn-primary", function () {
  window.location.href = `page/admin/blog-editor.html`;
});

async function fetchUsers() {
  const token = localStorage.getItem("admin_token");

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
    userMap = users.reduce((map, user) => {
      map[user.id] = user.userName;
      return map;
    }, {});
  } catch (err) {
    console.error("Failed to fetch users:", err);
  }
}

async function fetchBlogs() {
  const token = localStorage.getItem("admin_token");

  try {
    const res = await callApi({
      url: apiBlogSearch,
      method: "POST",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify({
        pageNumber: 0,
        pageSize: pageSize,
        orderBy: ["id"],
        ignorePagination: true,
      }),
      token: token,
    });

    const result = res.result;
    blogs = Array.isArray(result.data) ? result.data : [];
    currentPage = 1;
    updateTable();
  } catch (err) {
    console.error("Failed to fetch blogs:", err);
    blogs = [];
    updateTable();
  }
}

function renderTable(page) {
  const $tbody = $("#table tbody");
  $tbody.empty();

  if (blogs.length === 0) {
    $tbody.html(
      '<tr><td colspan="5" class="text-center py-3">Không có dữ liệu</td></tr>'
    );
    return;
  }

  const start = (page - 1) * pageSize;
  const pageData = blogs.slice(start, start + pageSize);
  let rows = "";
  pageData.forEach((blog, idx) => {
    const author = userMap[blog.authorId] || "N/A";

    rows += `<tr>
                    <td>${start + idx + 1}</td>
                    <td>${escapeHtml(blog.title || "")}</td>
                    <td>${escapeHtml(blog.category.name || "")}</td>
                    <td>${escapeHtml(blog.destination.name || "")}</td>
                    <td>${escapeHtml(author || "")}</td>
                    <td>  
                      <span class="status-pill ${StatusClass[blog.status]}">
                        ${escapeHtml(BlogStatus[blog.status] || "")}
                      </span>
                    </td>
                    <td>
                        <button class="btnEditBlog btn btn-sm btn-link text-primary" title="Edit"><i class="ti ti-edit"></i></button>
                        <button class="btn btn-sm btn-link text-danger" title="Archive"><i class="ti ti-archive"></i></button>
                    </td>
                </tr>`;
  });

  $tbody.html(rows);
}

function renderPagination() {
  const $ul = $("#table tfoot .pagination");
  $ul.empty();

  const totalPages = Math.ceil(blogs.length / pageSize);

  console.log(totalPages);

  if (blogs.length === 0 || totalPages === 0) {
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
    $("#table").scrollTop(0);
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
