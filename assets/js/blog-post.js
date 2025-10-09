const BASE_URL = "https://localhost:7109/";

var editor;
var countryId = "";
var thumbnailId = "";
var blogId = "1";
var blogApi = BASE_URL + "api/v1/admin/blogs/";
var userApi = BASE_URL + "api/v1/admin/user/";
var fileStorageApi = BASE_URL + "api/v1/file-storage/";
var destinationApi = BASE_URL + "api/v1/destinations/";
var apiAuthentication = BASE_URL + "api/v1/token";
var jq = jQuery.noConflict();

jq(document).ready(async function () {
  authentication();
  await loadPost(blogId);
});

function authentication() {
  jq.ajax({
    url: apiAuthentication,
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      email: "admin@hostname.com",
      password: "123qwe",
    }),
    success: function (res) {
      var token = res.token;
      localStorage.setItem("token", token);
    },
  });
}

async function loadPost(id) {
  var token = localStorage.getItem("token");

  await jq.ajax({
    url: blogApi + id,
    method: "GET",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + token,
    },
    success: function (response) {
      var result = response.result;
      renderBlogDetail(result);
    },
  });
}

async function renderBlogDetail(result) {
  var blog = result;
  jq(".blog-detail__title").text(blog.title);
  await getAuthor(blog.authorId);
  jq(".blog-detail__date").text(new Date(blog.createdOn).toLocaleDateString());
  jq(".blog-detail__time-read").text(blog.timeRead);
  await getDestination(blog.destinationId);
  await getThumbnail(blog.thumbnailId);
  await renderBlogContent(blog.content);
}

async function getDestination(id) {
  await jq.ajax({
    url: destinationApi + id,
    method: "GET",
    contentType: "application/json",
    success: function (response) {
      var result = response.result;
      var name = result.name;
      jq(".blog-detail__destination").text(name);
    },
  });
}

async function getThumbnail(id) {
  await jq.ajax({
    url: fileStorageApi + id,
    method: "GET",
    contentType: "application/json",
    success: function (response) {
      var result = response.result;
      var fullPath = result.fullPathUrl;

      if (fullPath != null) {
        jq(".blog-detail__thumbnail").attr("src", fullPath).show();
      } else {
        fullPath = "../assets/images/destination/Bali.jpg";
        jq(".blog-detail__thumbnail").attr("src", fullPath).show();
      }
    },
  });
}

async function getAuthor(id) {
  var token = localStorage.getItem("token");

  await jq.ajax({
    url: userApi + id,
    method: "GET",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + token,
    },
    success: function (response) {
      var result = response.result;
      jq(".blog-detail__author").html(`
              <b>Author:</b>
              <h6 class="blog-detail__author-value">${result.fullName}</h6>`);
    },
  });
}

function renderBlogContent(content) {
  content = JSON.parse(content);
  const container = jq(".blog-detail__content.container");
  container.empty();

  content.blocks.forEach((block) => {
    switch (block.type) {
      case "paragraph":
        container.append(
          `<p class="blog-detail__paragraph">${block.data.text}</p>`
        );
        break;
      case "header":
        container.append(
          `<h${block.data.level} class="blog-detail__header-text">${block.data.text}</h${block.data.level}>`
        );
        break;
      case "image":
        container.append(`
          <figure class="blog-detail__image">
            <img src="${block.data.file.url}" alt="">
            <figcaption>${block.data.caption || ""}</figcaption>
          </figure>
        `);
        break;
      case "list":
        const items = block.data.items.map((i) => `<li>${i}</li>`).join("");
        container.append(`<ul class="blog-detail__list">${items}</ul>`);
        break;
      default:
        console.log("Unsupported block type:", block.type);
    }
  });
}
