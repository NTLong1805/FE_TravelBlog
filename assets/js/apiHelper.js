const BASE_URL = "https://localhost:7109/";

async function callApi({
  url,
  method = "GET",
  data = null,
  token = null,
  contentType = "application/json",
}) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: BASE_URL + url,
      type: method,
      data: data
        ? contentType.includes("json")
          ? JSON.stringify(data)
          : data
        : null,
      processData: contentType.includes("json"),
      contentType: contentType,
      headers: token ? { Authorization: "Bearer " + token } : {},
      success: (res) => resolve(res),
      error: (xhr) => reject(xhr),
    });
  });
}

async function uploadFileApi(file, token) {
    const formData = new FormData();
    formData.append("FileData", file);
    return callApi({
        url: "api/v1/upload-file/single",
        method: "POST",
        data: formData,
        token: token,
        contentType: false
    });
}

export { callApi, uploadFileApi };