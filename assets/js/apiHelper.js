const BASE_URL = "https://localhost:7109/";

const $ = window.jQuery;

async function callApi({
  url,
  method = "GET",
  data = null,
  token = null,
  contentType = "application/json",
}) {
  try {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: BASE_URL + url,
        type: method,
        data: data ? data : null,
        processData: contentType === false ? false : true,
        contentType: contentType === false ? false : contentType,
        headers: token ? { Authorization: "Bearer " + token } : {},
        success: (res) => resolve(res),
        error: (xhr) => reject(xhr),
      });
    });
  } catch (error) {
    if (error.status === 401) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        logout();
        return;
      }

      accessToken = localStorage.getItem("accessToken");
      return new Promise((resolve, reject) => {
        $.ajax({
          url: BASE_URL + url,
          type: method,
          data: JSON.stringify(data),
          contentType: "application/json",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          success: (res) => resolve(res),
          error: (xhr) => reject(xhr),
        });
      });
    }

    throw error;
  }
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  const token = localStorage.getItem("token");
  if (!refreshToken || !token) return false;

  try {
    const result = await $.ajax({
      url: BASE_URL + "api/v1/token/refresh",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        token: token,
        refreshToken: refreshToken,
      }),
    });

    localStorage.setItem("token", result.token);
    localStorage.setItem("refreshToken", result.refreshToken);
    return true;
  } catch (error) {
    return false;
  }
}

async function uploadFileApi(file, token) {
  const formData = new FormData();
  formData.append("FileData", file);
  return callApi({
    url: "api/v1/upload-file/single",
    method: "POST",
    data: formData,
    token: token,
    contentType: false,
  });
}

export { callApi, uploadFileApi };
