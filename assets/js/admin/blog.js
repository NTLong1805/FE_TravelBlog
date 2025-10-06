const BASE_URL = "https://localhost:7109/" // for test

var apiBlogSearch = BASE_URL + "api/v1/admin/blogs/search";
var apiUserSearch = BASE_URL + "api/v1/admin/user/search";
var blogApi = BASE_URL + "api/v1/admin/blogs"
var apiAuthentication = BASE_URL + "api/v1/token";

let blogs = [];
let users = [];
let userMap = {};
var currentPage = 1;
var pageSize = 10;

$(document).ready(function () {
    authentication();
    fetchUsers();
    fetchBlogs();
});

$(document).on('click', '.btnPostBlog.btn.btn-primary', function () {
    window.location.href = `page/admin/blog-editor.html`;
});

function authentication() {
    $.ajax({
        url: apiAuthentication,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            "email": "admin@hostname.com",
            "password": "123qwe"
        }),
        success: function (res) {
            var token = res.token;
            localStorage.setItem("token", token);
        }
    })
}

function fetchUsers() {
    var token = localStorage.getItem("token");

    $.ajax({
        url: apiUserSearch,
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({
            "pageNumber": 0,
            "pageSize": pageSize,
            "orderBy": [
                "id"
            ],
            "ignorePagination": true
        }),
        headers: {
            "Authorization": "Bearer " + token
        },
        xhrFields: {
            witCredentials: true
        },
        success: function (response) {
            var result = response.result;
            users = Array.isArray(result.data) ? result.data : [];
            userMap = users.reduce((map, user) => {
                map[user.id] = user.userName;
                return map;
            }, {});
            updateTable();
        },
        error: function (xhr, status, error) {
            console.error("Failed to fetch categories:", error);
        },
    });
}

function fetchBlogs() {
    var token = localStorage.getItem("token");

    $.ajax({
        url: apiBlogSearch,
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({
            "pageNumber": 0,
            "pageSize": pageSize,
            "orderBy": [
                "id"
            ],
            "ignorePagination": true
        }),
        headers: {
            "Authorization": "Bearer " + token
        },
        xhrFields: {
            witCredentials: true
        },
        success: function (response) {
            var result = response.result;
            blogs = Array.isArray(result.data) ? result.data : [];
            currentPage = 1;
            updateTable();
        },
        error: function (xhr, status, error) {
            console.error("Failed to fetch categories:", error);
            blogs = [];
            updateTable();
        },
    });
}

function renderTable(page) {
    const $tbody = $("#table tbody");
    $tbody.empty();

    if (blogs.length === 0) {
        $tbody.html('<tr><td colspan="5" class="text-center py-3">Không có dữ liệu</td></tr>');
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
                    <td>${escapeHtml(blog.categoryId || "")}</td>
                    <td>${escapeHtml(author || "")}</td>
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
    $ul.append(`<li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
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