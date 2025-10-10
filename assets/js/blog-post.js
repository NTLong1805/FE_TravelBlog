import { callApi, uploadFileApi } from "./apiHelper.js";
import { authentication } from "./credentials.js";

var countryId = "";
var thumbnailId = "";
var blogId = "1";
var blogApi = "api/v1/admin/blogs/";
var userApi = "api/v1/admin/user/";
var fileStorageApi = "api/v1/file-storage/";
var destinationApi = "api/v1/destinations/";
var jq = jQuery.noConflict();

jq(document).ready(async function () {
  await authentication();
  await loadPost(blogId);
});

async function loadPost(id) {
  const token = localStorage.getItem("token");
  const response = await callApi({
    url: blogApi + id,
    method: "GET",
    token: token
  });
  renderBlogDetail(response.result);

  if (!token) {
    await authentication();
  }
}

async function renderBlogDetail(blog) {
  jq(".blog-detail__title").text(blog.title);
  jq(".blog-detail__date").text(new Date(blog.createdOn).toLocaleDateString());
  jq(".blog-detail__time-read").text(blog.timeRead);

  await Promise.all([
    getAuthor(blog.authorId),
    getDestination(blog.destinationId),
    getThumbnail(blog.thumbnailId),
  ]);

  renderBlogContent(blog.content);
}

async function getDestination(id) {
  const response = await callApi({
    url: destinationApi + id,
  });
  jq(".blog-detail__destination").text(response.result.name);
}

async function getThumbnail(id) {
  const response = await uploadFileApi({
    url: fileStorageApi + id,
  })
  const fullPath =
    response.result.fullPathUrl || "../assets/images/destination/Bali.jpg";
  jq(".blog-detail__thumbnail").attr("src", fullPath).show();
}

async function getAuthor(id) {
  const token = localStorage.getItem("token");
  const response = await callApi({
    url: userApi + id,
    method: "Get",
    token: token
  })

  const result = response.result;
  jq(".blog-detail__author").html(`
    <b>Author:</b>
    <h6 class="blog-detail__author-value">${result.fullName}</h6>
  `);
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
