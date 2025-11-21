import { callApi } from "./apiHelper.js";

var blogApi = "api/v1/blogs";
var jq = jQuery.noConflict();
let blog = [];

jq(document).ready(async function () {
  await Promise.all([
    loadLastestBlogs(),
    loadHostestBlogs(),
    renderCategories(),
  ]);

  jq("#navCategory").on("change", "input.navtab-input", async function () {
    const selectedCategoryId = this.id;
    if (selectedCategoryId === "allarticles") {
      await loadLastestBlogs();
    } else {
      await loadBlogsByCategory(selectedCategoryId);
    }
  });
});

async function loadBlogsByCategory(categoryId) {
  const response = await callApi({
    url: blogApi + "/search",
    method: "POST",
    data: JSON.stringify({
      advancedFilter: {
        logic: "and",
        filters: [
          {
            field: "categoryId",
            operator: "eq",
            value: parseInt(categoryId),
          },
          {
            field: "status",
            operator: "eq",
            value: 2,
          },
        ],
      },
      pageNumber: 1,
      pageSize: 5,
      orderBy: ["createdOn"],
    }),
  });

  blog = response.result.data;
  loadBlogsContent(blog);
}

async function renderCategories() {
  const response = await callApi({
    url: "api/v1/categories/has-blog",
    method: "GET",
  });

  const categories = response.result;
  let content = `<input
            type="radio"
            id="allarticles"
            name="tab"
            class="navtab-input"
            checked
          />
          <label for="allarticles" class="navtab-label">All Articles</label>`;

  categories.forEach((cat) => {
    content += `
         <!-- ${cat.name} -->
          <input type="radio" id="${cat.id}" name="tab" class="navtab-input" />
          <label for="${cat.id}" class="navtab-label">${cat.name}</label>
    `;
  });
  jq("#navCategory").html(content);
}

async function loadLastestBlogs() {
  const response = await callApi({
    url: blogApi + "/search",
    method: "POST",
    data: JSON.stringify({
      advancedFilter: {
        field: "status",
        operator: "eq",
        value: 2,
      },
      pageNumber: 1,
      pageSize: 5,
      orderBy: ["createdOn"],
    }),
  });

  blog = response.result.data;
  loadBlogsContent(blog);
}

function loadBlogsContent(blog) {
  let content = `
        <h2 class="blog__heading--small">Lastest</h2>
        <div class="row">
          <div class="col-7">
            <div class="blog-card">
              <a href="blog-post.html?id=${blog[0].id}" class="blog-card__img-wrap">
                <img
                  src="${blog[0].thumbnail.fullPathUrl}"
                  alt=""
                  class="blog-card__img"
                />
              </a>
              <a href="blog-post.html?id=${blog[0].id}" class="blog-card__heading">
                ${blog[0].title}
              </a>
              <a href="#!" class="blog-card__more">By ${blog[0].author.fullName}</a>
            </div>
          </div>
          <div class="col-5">
            <div class="blog-card">
              <a href="blog-post.html?id=${blog[1].id}" class="blog-card__img-wrap">
                <img
                  src="${blog[1].thumbnail.fullPathUrl}"
                  alt=""
                  class="blog-card__img"
                />
              </a>
              <a href="blog-post.html?id=${blog[1].id}" class="blog-card__heading">
                ${blog[1].title}
              </a>
              <a href="#!" class="blog-card__more">By ${blog[1].author.fullName}</a>
            </div>
          </div>
        </div>
        <div class="seperator"></div>
    `;

  if (blog.length > 2) {
    content += `<div class="row row-cols-lg-3">
          ${renderNextBlogs(blog.slice(2))}
        </div>`;
  }

  jq("#lastestBlogs").html(content);
}

async function loadHostestBlogs() {
  const response = await callApi({
    url: blogApi + "/search",
    method: "POST",
    data: JSON.stringify({
      advancedFilter: {
        field: "status",
        operator: "eq",
        value: 2,
      },
      pageNumber: 2,
      pageSize: 5,
      orderBy: ["createdOn"],
    }),
  });

  const blogs = response.result.data;
  let content = "";

  blogs.forEach((item) => {
    content += `
            <div class="col">
            <div class="blog-card">
              <a href="blog-post.html?id=${item.id}" class="blog-card__img-wrap">
                <img
                  src="${item.thumbnail.fullPathUrl}"
                  alt=""
                  class="blog-card__img"
                />
              </a>
              <a href="blog-post.html?id=${item.id}" class="blog-card__heading">
                ${item.title}
              </a>
              <a href="#!" class="blog-card__more">By ${item.author.fullName}</a>
            </div>
          </div>
        `;
  });

  jq("#hostestBlog").html(content);
}

function renderNextBlogs(blog) {
  let result = "";

  blog.forEach((item) => {
    result += `
            <div class="col">
            <div class="blog-card">
              <a href="blog-post.html?id=${item.id}" class="blog-card__img-wrap">
                <img
                  src="${item.thumbnail.fullPathUrl}"
                  alt=""
                  class="blog-card__img"
                />
              </a>
              <a href="blog-post.html?id=${item.id}" class="blog-card__heading">
                ${item.title}
              </a>
              <a href="#!" class="blog-card__more">By ${item.author.fullName}</a>
            </div>
          </div>
        `;
  });

  return result;
}
