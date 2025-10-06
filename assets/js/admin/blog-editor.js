const BASE_URL = "https://localhost:7109/" // for test

var editor;
var apiUploadFile = BASE_URL + "api/v1/upload-file/single";
var apiCategory = BASE_URL + "api/v1/admin/categories/search"
var blogApi = BASE_URL + "api/v1/admin/blogs"
var apiAuthentication = BASE_URL + "api/v1/token";
var thumbnailId = '';

$(document).ready(function () {
    authentication();
    loadCategories();
})

$(document).on("DOMContentLoaded", function () {
    var token = localStorage.getItem("token");

    editor = new EditorJS({
        holder: 'editorjs',
        placeholder: 'Type something...',
        tools: {
            image: {
                class: ImageTool,
                config: {
                    uploader: {
                        uploadByFile(file) {
                            return new Promise((resolve, reject) => {
                                var token = localStorage.getItem("token");
                                var formData = new FormData();
                                formData.append("FileData", file);

                                $.ajax({
                                    url: apiUploadFile,
                                    type: "POST",
                                    data: formData,
                                    processData: false,
                                    contentType: false,
                                    headers: {
                                        "Authorization": "Bearer " + token
                                    },
                                    success: function (response) {
                                        resolve({
                                            success: 1,
                                            file: {
                                                url: response.result.fullPathUrl
                                            }
                                        });
                                    },
                                    error: function (xhr, status, error) {
                                        console.error("Upload failed:", error);
                                        reject({
                                            success: 0
                                        });
                                    }
                                });
                            });
                        }
                    }
                }
            },
            header: {
                class: Header,
                inlineToolbar: true,
            },
            List: {
                class: EditorjsList,
                inlineToolbar: true,
                config: {
                    defaultStyle: 'unordered'
                }
            }
        }
    });
});

$(document).on('change', '#file-input', function () {
    const file = this.files[0];
    uploadFile(file)
})

$(document).on('click', '.btnBack.btn.btn-lg', function () {
    window.location.href = `page/admin/blog.html`;
});

$(document).on('click', '.btnSave.btn.btn-primary', saveBlog);

function authentication() {
    $.ajax({
        url: apiAuthentication,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            "email": "admin@hostname.com",
            "password": "123qwe"
        }),
        success: function (res) {
            var token = res.token;
            localStorage.setItem("token", token);
        }
    })
}

function uploadFile(file) {
    var token = localStorage.getItem("token");

    var formData = new FormData();
    formData.append('FileData', file);

    $.ajax({
        url: apiUploadFile,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        headers: {
            "Authorization": "Bearer " + token
        },
        xhrFields: {
            witCredentials: true
        },
        success: function (response) {
            var result = response.result;
            var fullPath = result.fullPathUrl;
            thumbnailId = result.id;
            $("#preview-img").attr("src", fullPath).show();
        },
        error: function (errors) {
            console.log(errors);
            alert("Failed to upload file:", errors.request);
        },
    })
}

function loadCategories() {
    var token = localStorage.getItem("token");

    $.ajax({
        url: apiCategory,
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({
            "ignorePagination": true
        }),
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        },
        success: function (response) {
            const select = $("#categorySelect");
            select.empty().append('<option value="">-- Select Category --</option>');
            var categories = response.result.data;
            categories.forEach(cat => {
                select.append(`<option value="${cat.id}">${cat.name}</option>`);
            });
        },
        error: function (err) {
            console.error("ERROR: Can't load categories:", err);
        }
    });
}

function saveBlog() {
    editor.save().then((outputData) => {
        var token = localStorage.getItem("token");

        $.ajax({
            url: blogApi,
            type: "POST",
            contentType: "application/json",
            headers: {
                "Authorization": "Bearer " + token
            },
            data: JSON.stringify({
                title: $("#title-input").val(),
                content: JSON.stringify(outputData),
                thumbnailId: thumbnailId,
                authorId: 1,
                categoryId: $('#categorySelect').val(),
                destinationId: 1,
            }),
            success: function (res) {
                console.log(res);
                window.location.href = "page/admin/blog.html"; 
            },
            error: function (xhr, status, error) {
                alert("Saving failed: " + error);
            }
        });
    }).catch((error) => {
        console.log("Saving failed: ", error);
    });
}