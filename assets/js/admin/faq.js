import { callApi } from "../apiHelper.js";
import { authentication } from "../credentials.js";

var apiFaqSearch = "api/v1/admin/faqs/search";
var faqApi = "api/v1/admin/faqs";

let faqs = [];
let filteredFaqs = [];
let faqSearchTerm = "";
let faqSearchTimer = null;
var currentPage = 1;
var pageSize = 10;

$(document).ready(async function () {
    await authentication();
    await fetchFaqs();
});

$(document).on("click", ".btnAddFaq", function () {
    var addFaqModal = new bootstrap.Modal(
        document.getElementById("addFaqModal")
    );
    addFaqModal.show();
});

$(document).on("submit", "#addFaqForm", function (e) {
    e.preventDefault();

    const question = document.getElementById("faqQuestion").value;
    const answer = document.getElementById("faqAnswer").value;

    addNewFaq(question, answer);

    bootstrap.Modal.getInstance(document.getElementById("addFaqModal")).hide();
    document.getElementById("addFaqForm").reset();
});

$(document).on(
    "click",
    ".btnEditFaq.btn.btn-sm.btn-link.text-primary",
    function () {
        const rowIndex = $(this).closest("tr").index();
        const faq = filteredFaqs[(currentPage - 1) * pageSize + rowIndex];
        if (faq && faq.id) {
            // TODO: Navigate to edit page or open edit modal
            console.log("Edit FAQ:", faq);
        }
    }
);

$(document).on("submit", "#faqSearchForm", function (e) {
    e.preventDefault();
    const keyword = $("#faqSearchInput").val();
    applyFaqSearch(keyword);
});

$(document).on("click", "#faqSearchReset", function () {
    if ($(this).prop("disabled")) {
        return;
    }
    $("#faqSearchInput").val("");
    applyFaqSearch("");
});

$(document).on("input", "#faqSearchInput", function () {
    const keyword = $(this).val();
    clearTimeout(faqSearchTimer);
    faqSearchTimer = setTimeout(() => {
        applyFaqSearch(keyword);
    }, 300);
});

async function fetchFaqs() {
    const token = localStorage.getItem("token");

    try {
        const res = await callApi({
            url: apiFaqSearch,
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
        faqs = Array.isArray(result.data) ? result.data : [];
        applyFaqSearch(faqSearchTerm, { skipInputSync: true });
    } catch (err) {
        console.error("Failed to fetch FAQs:", err);
        faqs = [];
        filteredFaqs = [];
        currentPage = 1;
        updateTable();
    }
}

async function addNewFaq(question, answer) {
    const token = localStorage.getItem("token");

    try {
        await callApi({
            url: faqApi,
            method: "POST",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
                question: question,
                answer: answer,
            }),
            token: token,
        });

        await fetchFaqs();
    } catch (err) {
        console.error("Failed to add FAQ:", err);
    }
}

function renderTable(page) {
    const $tbody = $(".faq-table-body");
    $tbody.empty();

    if (!filteredFaqs.length) {
        $tbody.html(
            '<tr><td colspan="4" class="text-center py-3">Không có dữ liệu</td></tr>'
        );
        return;
    }

    const start = (page - 1) * pageSize;
    const pageData = filteredFaqs.slice(start, start + pageSize);
    let rows = "";
    pageData.forEach((faq, idx) => {
        rows += `<tr>
                    <td>${start + idx + 1}</td>
                    <td>${escapeHtml(faq.question || "")}</td>
                    <td>${escapeHtml(faq.answer || "").substring(0, 100)}${
            faq.answer && faq.answer.length > 100 ? "..." : ""
        }</td>
                    <td>
                        <button class="btnEditFaq btn btn-sm btn-link text-primary" title="Edit"><i class="ti ti-edit"></i></button>
                        <button class="btn btn-sm btn-link text-danger" title="Archive"><i class="ti ti-archive"></i></button>
                    </td>
                </tr>`;
    });

    $tbody.html(rows);
}

function renderPagination() {
    const $ul = $("#faq-table tfoot .pagination");
    $ul.empty();

    const totalPages = Math.ceil(filteredFaqs.length / pageSize);

    if (!filteredFaqs.length || totalPages === 0) {
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
        $("#faq-table").scrollTop(0);
    });
}

function updateTable() {
    renderTable(currentPage);
    renderPagination();
}

function applyFaqSearch(keyword, options = {}) {
    const { skipInputSync = false } = options;
    faqSearchTerm = (keyword || "").toString();
    const normalized = faqSearchTerm.trim().toLowerCase();

    if (!normalized) {
        filteredFaqs = [...faqs];
    } else {
        filteredFaqs = faqs.filter((faq) => {
            const question = (faq.question || "").toString().toLowerCase();
            const answer = (faq.answer || "").toString().toLowerCase();

            return question.includes(normalized) || answer.includes(normalized);
        });
    }

    if (!skipInputSync) {
        $("#faqSearchInput").val(faqSearchTerm);
    }

    toggleFaqSearchResetState();
    currentPage = 1;
    updateTable();
}

function toggleFaqSearchResetState() {
    const hasKeyword = faqSearchTerm.trim().length > 0;
    $("#faqSearchReset").prop("disabled", !hasKeyword);
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
