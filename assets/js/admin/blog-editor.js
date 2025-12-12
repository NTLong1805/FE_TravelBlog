import { callApi, uploadFileApi } from "../apiHelper.js";
import { parseJwt } from "../common.js";

var editor;
var apiCategory = "api/v1/admin/categories/search";
var blogApi = "api/v1/admin/blogs";
var countryApi = "api/v1/admin/countries/search";
var destinationApi = "api/v1/admin/countries/{id}/destinations";
var thumbnailId = "";
const token = localStorage.getItem("admin_token");
const currentUserId = parseJwt(token).userId;
const params = new URLSearchParams(window.location.search);
const blogId = params.get("id");

$(document).ready(async function () {
  initEditor();
  await loadCategories();
  await loadCountries();

  if (blogId) {
    await loadBlog(blogId);
  }

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

async function loadBlog(id) {
  const res = await callApi({
    url: `${blogApi}/${id}`,
    method: "GET",
    token: token
  });

  const blog = res.result;

  // check quyền sở hữu blog
  if (blog.authorId != currentUserId) {
    disableEditingUI();
    $(".lb-upload").hide();
  }

  // set UI values
  $("#title-input").val(blog.title);
  $("#categorySelect").val(blog.categoryId).trigger("change");
  $("#preview-img").attr("src", blog.thumbnail?.fullPathUrl || "").show();
  thumbnailId = blog.thumbnailId;

  // load Destination
  $("#countrySelect").val(blog.destination.countryId);
  await loadDestinationsByCountry(blog.destination.countryId);
  $("#destinationSelect").val(blog.destinationId);

  // load Editor.js content
  editor.render(JSON.parse(blog.content));
}

function disableEditingUI() {
  $("#title-input").prop("disabled", true);
  $("#categorySelect").prop("disabled", true);
  $("#countrySelect").prop("disabled", true);
  $("#destinationSelect").prop("disabled", true);
  $("#file-input").prop("disabled", true);
  $(".btnSave").hide();

  // Editor.js không có chế độ readOnly mặc định
  // nhưng bạn có thể chặn toolbar + input
  const style = document.createElement("style");
  style.innerHTML = `
    .ce-toolbar, .ce-settings {
      display: none !important;
    }
    .ce-block__content {
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

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

async function saveBlog() {
  editor.save().then(async (outputData) => {
    const payload = {
      title: $("#title-input").val(),
      content: JSON.stringify(outputData),
      thumbnailId: thumbnailId,
      authorId: currentUserId,
      categoryId: $("#categorySelect").val(),
      destinationId: $("#destinationSelect").val(),
    };

    const url = blogId ? `${blogApi}/${blogId}` : blogApi;
    const method = blogId ? "PUT" : "POST";

    await callApi({
      url: url,
      method: method,
      data: JSON.stringify(payload),
      token: token,
    });

    window.location.href = "page/admin/blog.html";
  })
  .catch((error) => {
    console.log("Saving failed: ", error);
  });
}

async function loadCountries() {
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
  const url = destinationApi.replace("{id}", id);
  const res = await callApi({
    url: url,
    method: "GET",
    token: token,
  });

  const select = $("#destinationSelect");
  select.empty().append('<option value="">-- Select Destination --</option>');
  res.result.forEach((destination) => {
    select.append(`<option value="${destination.id}">${destination.name}</option>`);
  });
}