import { callApi } from "./apiHelper.js";

var blogApi = "api/v1/blogs/";
var commentApi = "api/v1/comment/";
var jq = jQuery.noConflict();

const urlParams = new URLSearchParams(window.location.search);
const blogId = urlParams.get("id");
const token = localStorage.getItem("token");

jq(document).ready(async function () {
  await loadPost(blogId);

  if (!token) {
    jq(".blog-comments__login-required").show();
  } else {
    jq(".blog-comments__form").show();
  }

  jq(".blog-comments__submit").click(async function () {
    const content = jq(".blog-comments__input").val().trim();
    if (!content) return alert("Bạn chưa nhập bình luận");

    const result = await callApi({
      url: commentApi + blogId,
      method: "POST",
      token: token,
      data: JSON.stringify({ content: content }),
    });

    jq(".blog-comments__input").val("");
    loadPost(blogId);
  });

  jq(".btn-login-comment").click(function () {
    console.log("clicked");
    window.location.href = "sign-in.html";
  });
});

jq(".back-button__btn").on("click", function () {
  window.history.back();
});

async function loadPost(id) {
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
  jq(".blog-detail__time-read").text(blog.timeRead + " min read");
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
  let currentUser = '';
  if (token) {
    const payload = JSON.parse(atob(token.split(".")[1]));
    currentUser = payload.userId;
  }

  const html = list
    .map(
      (c) => `
            <div class="comment-item">
              <div class="row" style="justify-content: space-between; gap: 8px; margin-bottom: 4px;"> 
                <b>${c.user.fullName}</b>
                <button class="comment-item__button" style="cursor: pointer; display: ${currentUser != c.userId ? "none" : ""}" data-id="${c.id}"><i class="fa-solid fa-xmark"></i></button>
              </div>
              <p>${c.content}</p>
              <span class="comment-date">${new Date(
                c.createdOn
              ).toLocaleString()}</span>
            </div>
          `
    )
    .join("");

  jq(".blog-comments__list").html(html);
}

jq(document).on("click", ".comment-item__button" , async function() {
  const commentId = jq(this).data('id');
  await deleteComment(commentId);
});

async function deleteComment(id) {
  if (confirm("Are you sure to delete this comment?")) {
    const response = await callApi({
      url: commentApi + "" + id,
      method: "DELETE",
      token: token,
    });

    loadPost(blogId);
  }
}