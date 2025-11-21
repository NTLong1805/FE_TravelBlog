import { callApi } from "../apiHelper.js";

const token = localStorage.getItem("admin_token");
const categoriesApi = await callApi({
  url: "api/v1/admin/categories/search",
  method: "POST",
  data: JSON.stringify({
    ignorePagination: true,
  }),
  token: token,
});
const commentsApi = await callApi({
  url: "api/v1/admin/comment/search",
  method: "POST",
  data: JSON.stringify({
    ignorePagination: true,
  }),
  token: token,
});

const categories = categoriesApi.result.data.map((item) => item.name);
const categoriesData = categoriesApi.result.data.map(
  (item) => item.numberOfPosts
);
const maxValue = Math.max(...categoriesData);
const roundedMax = Math.ceil(maxValue / 10) * 10;

const comments = commentsApi.result.data;
let content = "";

comments.forEach((comment) => {
  content += `<div class="d-flex flex-row comment-row border-bottom p-3 gap-3">
                <div>
                  <span><img src="assets/images/profile/user-3.jpg" class="rounded-circle" alt="user"
                      width="50" /></span>
                </div>
                <div class="comment-text w-100">
                  <h6 class="fw-medium">${comment.user.fullName} > ${comment.blog.title}</h6>
                  <p class="mb-1 fs-2 text-muted">
                    ${comment.content}
                  </p>
                  <div class="comment-footer mt-2">
                    <span class="
                        text-muted
                        ms-auto
                        fw-normal
                        fs-2
                        d-block
                        mt-2
                        text-end
                      ">${new Date(comment.createdOn).toLocaleString()}</span>
                  </div>
                </div>
              </div>`;
});

$('#comments-content').html(content);

$(function () {
  var options_sales_overview = {
    series: [
      {
        name: "Number of Posts",
        data: categoriesData,
      },
    ],
    chart: {
      type: "bar",
      height: 275,
      toolbar: {
        show: false,
      },
      foreColor: "#adb0bb",
      fontFamily: "inherit",
      sparkline: {
        enabled: false,
      },
    },
    grid: {
      show: false,
      borderColor: "transparent",
      padding: {
        left: 0,
        right: 0,
        bottom: 0,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "25%",
        endingShape: "rounded",
        borderRadius: 5,
      },
    },
    colors: ["var(--bs-primary)", "var(--bs-secondary)"],
    dataLabels: {
      enabled: false,
    },
    yaxis: {
      show: true,
      min: 0,
      max: roundedMax,
      tickAmount: 2,
    },
    stroke: {
      show: true,
      width: 5,
      lineCap: "butt",
      colors: ["transparent"],
    },
    xaxis: {
      type: "category",
      categories: categories,
      axisBorder: {
        show: false,
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      theme: "dark",
    },
    legend: {
      show: false,
    },
  };

  var chart_column_basic = new ApexCharts(
    document.querySelector("#sales-overview"),
    options_sales_overview
  );
  chart_column_basic.render();
});
