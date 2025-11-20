import { callApi, uploadFileApi } from "../apiHelper.js";

var editor;
var apiCategory = "api/v1/admin/categories/search";
var blogApi = "api/v1/admin/blogs";
var countryApi = "api/v1/admin/countries/search";
var destinationApi = "api/v1/admin/countries/{id}/destinations";
var thumbnailId = "";

$(document).ready(async function () {
  initEditor();
  await loadCategories();
  await loadCountries();

  $(document).on("change", "#countrySelect", async function () {
    const countryId = $(this).val();
    await loadDestinationsByCountry(countryId);
  });
});

$(document).on("DOMContentLoaded", function () {});

$(document).on("change", "#file-input", function () {
  const file = this.files[0];
  uploadFile(file);
});

$(document).on("click", ".btnBack.btn.btn-lg", function () {
  window.location.href = `page/admin/blog.html`;
});

$(document).on("click", ".btnSave.btn.btn-primary", saveBlog);

function initEditor() {
  editor = new EditorJS({
    holder: "editorjs",
    placeholder: "Type something...",
    tools: {
      image: {
        class: ImageTool,
        config: {
          uploader: {
            async uploadByFile(file) {
              const token = localStorage.getItem("admin_token");
              const response = await uploadFileApi(file, token);
              return {
                success: 1,
                file: {
                  url: response.result.fullPathUrl,
                },
              };
            },
          },
        },
      },
      header: {
        class: Header,
        inlineToolbar: true,
      },
      List: {
        class: EditorjsList,
        inlineToolbar: true,
        config: {
          defaultStyle: "unordered",
        },
      },
    },
  });
}

async function uploadFile(file) {
  const token = localStorage.getItem("admin_token");
  try {
    const response = await uploadFileApi(file, token);
    const result = response.result;
    thumbnailId = result.id;
    $("#preview-img").attr("src", result.fullPathUrl).show();
  } catch (err) {
    console.error("Upload failed:", err);
  }
}

async function loadCategories() {
  const token = localStorage.getItem("admin_token");
  const res = await callApi({
    url: apiCategory,
    method: "POST",
    data: JSON.stringify({ ignorePagination: true }),
    token: token,
  });

  const select = $("#categorySelect");
  select.empty().append('<option value="">-- Select Category --</option>');
  res.result.data.forEach((cat) => {
    select.append(`<option value="${cat.id}">${cat.name}</option>`);
  });
}

function saveBlog() {
  editor
    .save()
    .then(async (outputData) => {
      const token = localStorage.getItem("admin_token");

      const res = await callApi({
        url: blogApi,
        method: "POST",
        data: JSON.stringify({
          title: $("#title-input").val(),
          content: JSON.stringify(outputData),
          thumbnailId: thumbnailId,
          authorId: 1,
          categoryId: $("#categorySelect").val(),
          destinationId: 1,
        }),
        token: token,
      });

      window.location.href = "page/admin/blog.html";
    })
    .catch((error) => {
      console.log("Saving failed: ", error);
    });
}

async function loadCountries() {
  const token = localStorage.getItem("admin_token");
  const res = await callApi({
    url: countryApi,
    method: "POST",
    data: JSON.stringify({ ignorePagination: true }),
    token: token,
  });

  const select = $("#countrySelect");
  select.empty().append('<option value="">-- Select Country --</option>');
  res.result.data.forEach((country) => {
    select.append(`<option value="${country.id}">${country.name}</option>`);
  });
}

async function loadDestinationsByCountry(id) {
  const token = localStorage.getItem("admin_token");
  const url = destinationApi.replace("{id}", id);
  const res = await callApi({
    url: url,
    method: "GET",
    token: token,
  });

  const select = $("#destinationSelect");
  select.empty().append('<option value="">-- Select Destination --</option>');
  res.result.result.forEach((destination) => {
    select.append(`<option value="${destination.id}">${destination.name}</option>`);
  });
}