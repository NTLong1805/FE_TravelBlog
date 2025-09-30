const BASE_URL = "https://localhost:7109/" // for test

var apiUploadFile = BASE_URL + "api/v1/upload-file/single";
var apiAuthentication = BASE_URL + "api/v1/token";


$(document).ready(function() {
    authentication();
})

$(document).on("DOMContentLoaded", function () {
    const editor = new EditorJS({
        holder: 'editorjs',
        placeholder: 'Type something...',
        tools: {
            image: {
                class: ImageTool,
                config: {
                    endpoints: {
                        byFile: '', // Your backend file uploader endpoint
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
    // if (file) {
    //     const reader = new FileReader();
    //     reader.onload = function (e) {
    //         previewImg.src = e.target.result;
    //         previewImg.style.display = "block";
    //     }
    //     reader.readAsDataURL(file);
    // } else {
    //     previewImg.src = "";
    //     previewImg.style.display = "none";
    // }
})

$(document).on('click', '.btnBack.btn.btn-lg', function () {
    window.location.href = `page/admin/blog.html`;
});

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
            console.log(fullPath);
            $("#preview-img").attr("src", fullPath).show();
        },
        error: function (xhr, status, error) {
            console.error("Failed to upload file:", error);
        },
    })
}