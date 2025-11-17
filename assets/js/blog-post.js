import { callApi } from "./apiHelper.js";

var blogId = "1";
var blogApi = "api/v1/blogs/";
var commentApi = "api/v1/comment/";
var jq = jQuery.noConflict();

jq(document).ready(async function () {
  const token = localStorage.getItem("token");
  // const postId = getPostIdFromURL();
  await loadPost(blogId);

  if (!token) {
    jq(".blog-comments__login-required").show();
  } else {
    jq(".blog-comments__form").show();
  }

  jq(".blog-comments__submit").click(function () {
    const content = jq(".blog-comments__input").val().trim();
    if (!content) return alert("Bạn chưa nhập bình luận");

    jq.ajax({
      url: commentApi + postId,
      method: "POST",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + token,
      },
      data: JSON.stringify({ content }),
      success: function () {
        jq(".blog-comments__input").val("");
        loadComments();
      },
    });
  });

  jq(".btn-login-comment").click(function () {
    console.log("clicked");
    window.location.href = "sign-in.html";
  });
});

async function loadPost(id) {
  const token = localStorage.getItem("token");
  const response = await callApi({
    url: blogApi + id,
    method: "GET",
    token: token,
  });
  renderBlogDetail(response.result);
}

async function renderBlogDetail(blog) {
  jq(".blog-detail__title").text(blog.title);
  jq(".blog-detail__date").text(new Date(blog.createdOn).toLocaleDateString());
  jq(".blog-detail__time-read").text(blog.timeRead);
  jq(".blog-detail__destination").text(blog.destination.name);

  renderBlogContent(blog.content);

  jq(".blog-detail__thumbnail").attr("src", blog.thumbnail.fullPathUrl).show();
  jq(".blog-detail__author").html(`
    <b>Author:</b>
    <h6 class="blog-detail__author-value">${blog.author.fullName}</h6>
  `);

  loadComments(blog.comments);
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

function loadComments(list) {
  const html = list
    .map(
      (c) => `
            <div class="comment-item">
              <b>${c.authorName}</b>
              <p>${c.content}</p>
              <span class="comment-date">${new Date(
                c.createdAt
              ).toLocaleString()}</span>
            </div>
          `
    )
    .join("");

  jq(".blog-comments__list").html(html);
}
