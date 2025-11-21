import { callApi } from "../apiHelper.js";

const token = localStorage.getItem("admin_token");

var apiBlogSearch = "api/v1/admin/blogs/search";
var apiUserSearch = "api/v1/admin/user/search";

let blogs = [];
let users = [];
let userMap = {};
var currentPage = 1;
var pageSize = 10;
let selectedStatus = "all";

const BlogStatus = {
  0: "Draft",
  1: "In Review",
  2: "Approved",
  3: "Rejected",
};

const StatusClass = {
  0: "border-secondary text-secondary",
  1: "border-warning text-warning",
  2: "border-success text-success",
  3: "border-danger text-danger",
};

$(document).ready(async function () {
  await fetchUsers();
  await fetchBlogs();
});

$(document).on("click", ".btnPostBlog.btn.btn-primary", function () {
  window.location.href = `page/admin/blog-editor.html`;
});

$(document).on("click", ".blog-status-tabs .nav-link", function (e) {
  e.preventDefault();
  $(".blog-status-tabs .nav-link").removeClass("active");
  $(this).addClass("active");

  selectedStatus = $(this).data("status");

  currentPage = 1;
  updateTable();
});

$(document).on("click", ".btn-approve", async function () {
  const id = $(this).data("id");

  if (confirm("Are you sure you want to approve this blog?") === false) {
    return;
  }

  try {
    const result = await callApi({
      url: "api/v1/admin/blog-request/" + id + "/approval",
      method: "POST",
      data: JSON.stringify({
        approverId: 1,
      }),
      token: token,
    });

    alert("Blog approved successfully!");
    const blog = blogs.find((b) => b.id == id);
    if (blog) blog.status = 2;
    currentPage = 1;
    updateTable();
  } catch (err) {
    alert("Failed to approve blog!");
    console.error(err);
    return;
  }
});

$(document).on("click", ".btn-reject", async function () {
  const id = $(this).data("id");

  if (confirm("Are you sure you want to reject this blog?") === false) {
    return;
  }

  try {
    const result = await callApi({
      url: "api/v1/admin/blog-request/" + id + "/reject",
      method: "POST",
      data: JSON.stringify({
        rejectorId: 1,
      }),
      token: token,
    });

    alert("Blog rejected successfully!");
    const blog = blogs.find((b) => b.id == id);
    if (blog) blog.status = 3;
    currentPage = 1;
    updateTable();
  } catch (err) {
    alert("Failed to reject blog!");
    console.error(err);
    return;
  }
});

async function fetchUsers() {
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

  // Lọc theo status
  const filteredBlogs =
    selectedStatus === "all"
      ? blogs
      : blogs.filter((b) => b.status == selectedStatus);

  if (filteredBlogs.length === 0) {
    $tbody.html(
      '<tr><td colspan="6" class="text-center py-3">Không có dữ liệu</td></tr>'
    );
    return;
  }

  const start = (page - 1) * pageSize;
  const pageData = filteredBlogs.slice(start, start + pageSize);
  let rows = "";

  pageData.forEach((blog, idx) => {
    const author = userMap[blog.authorId] || "N/A";

    let statusCell = `
      <span class="status-pill ${StatusClass[blog.status]}">
        ${escapeHtml(BlogStatus[blog.status])}
      </span>
    `;

    // Nếu đang In Review ⇒ thêm hai nút
    if (blog.status == 1) {
      statusCell = `
        <button class="btn-approve ms-2 btn btn-sm btn-outline-success" data-id="${blog.id}">
          <i class="ti ti-check"></i>
        </button>
        <button class="btn-reject ms-1 btn btn-sm btn-outline-danger" data-id="${blog.id}">
          <i class="ti ti-x"></i>
        </button>
      `;
    }

    rows += `
      <tr>
        <td>${start + idx + 1}</td>
        <td>${escapeHtml(blog.title || "")}</td>
        <td>${escapeHtml(blog.category?.name || "")}</td>
        <td>${escapeHtml(blog.destination?.name || "")}</td>
        <td>${escapeHtml(author)}</td>
        <td>${statusCell}</td>
      </tr>`;
  });

  $tbody.html(rows);
}

function renderPagination() {
  const $ul = $("#table tfoot .pagination");
  $ul.empty();

  const filteredBlogs =
    selectedStatus === "all"
      ? blogs
      : blogs.filter((b) => b.status == selectedStatus);

  const totalPages = Math.ceil(filteredBlogs.length / pageSize);

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
